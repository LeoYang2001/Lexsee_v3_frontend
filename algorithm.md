getNextReview(next_due,review_phase,recall_accuracy)

# Next Review Algorithm

Input:

```javascript
{
  next_due: Date;
  review_interval: number; // in days
  ease_factor: number; // e.g. starts at 2.5
  recall_accuracy: "poor" | "fair" | "good" | "excellent";
}
```

Output

```javascript
{
  next_due: Date;
  review_interval: number;
  ease_factor: number;
}
```

| recall_accuracy | Meaning       | Interval Change | Ease Factor Change |
| --------------- | ------------- | --------------- | ------------------ |
| "poor"          | Forgot        | reset to 1 day  | −0.20              |
| "fair"          | Hard recall   | ×1.2            | −0.15              |
| "good"          | Normal recall | ×EF             | no change          |
| "excellent"     | Very easy     | ×EF×1.3         | +0.15              |
