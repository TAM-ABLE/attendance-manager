export const Loader = ({ size = 24, border = 3 }: { size?: number; border?: number }) => (
  <div
    className="animate-spin rounded-full border-t-transparent border-black"
    style={{ width: size, height: size, borderWidth: border }}
  />
)
