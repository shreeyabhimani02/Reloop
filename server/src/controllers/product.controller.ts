import { Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Wishlist from "../models/Wishlist.js";
import Notification from "../models/Notification.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { emitNotification } from "../socket.js";

export async function getSellerProducts(
  req: AuthRequest,
  res: Response
) {
  try {
    const sellerId = req.params.sellerId;

    if (!sellerId || Array.isArray(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seller ID",
      });
    }

    const products = await Product.find({
      seller: sellerId,
    })
      .populate(
        "seller",
        "name avatar bio location rating totalRatings itemsSold responseRate"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Get seller products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller products",
    });
  }
}

// GET /api/products
export async function getProducts(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      condition,
      brand,
      color,
      size,
      sort = "newest",
      page = "1",
      limit = "12",
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
      Math.max(Number(limit) || 12, 1),
      50
    );

    const filter: Record<string, unknown> = {
      isSold: false,
    };

    if (search) {
      filter.$text = {
        $search: String(search),
      };
    }

    if (category) {
      filter.category = String(category);
    }

    if (condition) {
      filter.condition = String(condition);
    }

    if (brand) {
      filter.brand = {
        $regex: String(brand),
        $options: "i",
      };
    }

    if (color) {
      filter.color = {
        $regex: String(color),
        $options: "i",
      };
    }

    if (size) {
      filter.size = {
        $regex: String(size),
        $options: "i",
      };
    }

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};

      if (minPrice) {
        priceFilter.$gte = Number(minPrice);
      }

      if (maxPrice) {
        priceFilter.$lte = Number(maxPrice);
      }

      filter.price = priceFilter;
    }

    let sortOption: Record<string, 1 | -1> = {
      createdAt: -1,
    };

    if (sort === "price-low") {
      sortOption = { price: 1 };
    }

    if (sort === "price-high") {
      sortOption = { price: -1 };
    }

    if (sort === "popular") {
      sortOption = { views: -1 };
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate(
          "seller",
          "name avatar rating totalRatings itemsSold responseRate"
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
}

// GET /api/products/:id
export async function getProductById(
  req: AuthRequest,
  res: Response
) {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "name avatar bio location rating totalRatings itemsSold responseRate"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Increment views
    product.views += 1;
    await product.save();

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
}

// POST /api/products
export async function createProduct(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      images,
      location,
      brand,
      size,
      color,
    } = req.body;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const product = await Product.create({
      title,
      description,
      price,
      category,
      condition,
      images,
      seller: req.userId,
      location,
      brand,
      size,
      color,
    });

    const populatedProduct = await product.populate(
      "seller",
      "name avatar rating totalRatings itemsSold responseRate"
    );

    return res.status(201).json({
      success: true,
      message: "Product listed successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
}

// PUT /api/products/:id
// PUT /api/products/:id
export async function updateProduct(
  req: AuthRequest,
  res: Response
) {
  try {
    const productId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own listings",
      });
    }

    // Keep the original price before applying updates
    const oldPrice = product.price;

    const allowedFields = [
      "title",
      "description",
      "price",
      "category",
      "condition",
      "images",
      "location",
      "brand",
      "size",
      "color",
      "isSold",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (product as any)[field] = req.body[field];
      }
    }

    const newPrice = product.price;

    // Check whether the price actually decreased
    const priceDropped =
      typeof oldPrice === "number" &&
      typeof newPrice === "number" &&
      newPrice < oldPrice;

    await product.save();

    // Create price-drop notifications
    if (priceDropped) {
      const wishlists = await Wishlist.find({
        products: product._id,
        user: {
          $ne: product.seller,
        },
      }).select("user");

      if (wishlists.length > 0) {
        const notifications = wishlists.map(
          (wishlist) => ({
            user: wishlist.user,
            type: "price_drop" as const,
            title: "Price drop on a wishlist item",
            message: `${product.title} dropped from ₹${oldPrice.toLocaleString(
              "en-IN"
            )} to ₹${newPrice.toLocaleString(
              "en-IN"
            )}.`,
            product: product._id,
            read: false,
          })
        );

        const createdNotifications =
          await Notification.insertMany(
            notifications
          );

        for (const notification of createdNotifications) {
          const populatedNotification =
            await Notification.findById(
              notification._id
            ).populate(
              "product",
              "title images price"
            );

          if (!populatedNotification) {
            continue;
          }

          emitNotification(
            notification.user.toString(),
            {
              _id:
                populatedNotification._id.toString(),

              type:
                populatedNotification.type,

              title:
                populatedNotification.title,

              message:
                populatedNotification.message,

              product:
                populatedNotification.product
                  ? {
                      _id:
                        (
                          populatedNotification.product as any
                        )._id.toString(),

                      title:
                        (
                          populatedNotification.product as any
                        ).title,

                      images:
                        (
                          populatedNotification.product as any
                        ).images || [],

                      price:
                        (
                          populatedNotification.product as any
                        ).price,
                    }
                  : undefined,

              read:
                populatedNotification.read,

              createdAt:
                populatedNotification.createdAt,

              updatedAt:
                populatedNotification.updatedAt,
            }
          );
        }
              }
    }

    const populatedProduct = await product.populate(
      "seller",
      "name avatar rating totalRatings itemsSold responseRate"
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
}

// DELETE /api/products/:id
export async function deleteProduct(
  req: AuthRequest,
  res: Response
) {
  try {
    const productId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own listings",
      });
    }

    await Product.findByIdAndDelete(productId);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
}

// GET /api/products/suggestions?q=
export async function getSearchSuggestions(
  req: AuthRequest,
  res: Response
) {
  try {
    const query = String(req.query.q || "").trim();

    if (query.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: [],
      });
    }

    const regex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const products = await Product.find({
      isSold: false,
      $or: [
        { title: regex },
        { brand: regex },
        { category: regex },
      ],
    })
      .select("title brand category")
      .limit(30)
      .lean();

    const suggestions = new Set<string>();

    for (const product of products) {
      if (
        product.title &&
        regex.test(product.title)
      ) {
        suggestions.add(product.title);
      }

      if (
        product.brand &&
        regex.test(product.brand)
      ) {
        suggestions.add(product.brand);
      }

      if (
        product.category &&
        regex.test(product.category)
      ) {
        suggestions.add(product.category);
      }
    }

    return res.status(200).json({
      success: true,
      suggestions: Array.from(suggestions).slice(
        0,
        8
      ),
    });
  } catch (error) {
    console.error(
      "Get search suggestions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch search suggestions",
    });
  }
}