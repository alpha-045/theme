import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating = ({ rating, maxStars = 5, size = 16, interactive = false, onChange }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
          >
            <Star
              size={size}
              className={
                filled
                  ? "fill-accent text-accent"
                  : half
                  ? "fill-accent/50 text-accent"
                  : "fill-none text-muted-foreground/40"
              }
            />
          </button>
        );
      })}
      <span className="ml-1 text-sm text-muted-foreground font-medium">{rating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;
