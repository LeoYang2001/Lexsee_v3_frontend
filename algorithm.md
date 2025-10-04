# Next Review Algorithm

location:
lib/reviewAlgorithm.ts

Input:

```javascript
{
  review_interval: number; // in days. initial value is 1 (the next day)
  ease_factor: number; // e.g. starts at 2.0
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
| "fair"          | Hard recall   | no change        | −0.15              |
| "good"          | Normal recall | ×EF             | no change          |
| "excellent"     | Very easy     | ×EF×1.3         | +0.15              |

lowest ease factor: 1.3
cutoff interval: 60days (when you reach 60 days interval, it means you mastered that word)

# Research:

“In a randomized trial with 90 dental students, those who used a mobile flashcard app with spaced repetition retained much more information after one month and still had significantly higher retention after three months than students who only attended lectures. This means that spacing out reviews (instead of just learning once) really matters for long-term memory.”

https://pubmed.ncbi.nlm.nih.gov/38693655/

# Comment:

Our review system is based on the SM-2 algorithm, developed by Piotr Woźniak in the late 1980s.
This algorithm became the foundation for popular spaced repetition tools like Anki and SuperMemo.

SM-2 uses mathematical modeling and decades of learner data to determine the optimal time to review each item—just before you’re likely to forget it.
This approach has been validated by thousands of learners and shown to significantly improve long-term memory retention compared to traditional study methods.

(Reference: Woźniak, P. A. (1990). Optimization of Learning [Master’s Thesis, University of Poznań]; SuperMemo Research Foundation.)

Have a graph like this:
![Spaced Repetition | Dietrich School of Arts & Sciences Undergraduate Studies](https://www.asundergrad.pitt.edu/sites/default/files/assets/Study%20Lab/Ebbinghaus-forgetting-curve-and-review-cycle.png)
