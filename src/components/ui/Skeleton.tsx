interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export default function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "8px",
}: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
}