const QUOTES = [
  { text: "The best investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "Real estate cannot be lost or stolen, nor can it be carried away. Managed with reasonable care, it is about the safest investment in the world.", author: "Franklin D. Roosevelt" },
  { text: "Don't wait to buy real estate. Buy real estate and wait.", author: "Will Rogers" },
  { text: "The goal is not to work for money, but to have money work for you.", author: "Robert Kiyosaki" },
  { text: "In real estate, you make 10% of your money because you're a genius and 90% because you catch a great wave.", author: "Jeff Greene" },
  { text: "Ninety percent of all millionaires become so through owning real estate.", author: "Andrew Carnegie" },
  { text: "Every day is a new opportunity to close the gap between where you are and where you want to be.", author: "Brian Tracy" },
  { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
  { text: "It's not about having time. It's about making time.", author: "Unknown" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Done is better than perfect. Ship it.", author: "Unknown" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "The key to wealth is finding deals others overlook.", author: "Unknown" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Work while they sleep. Learn while they party. Save while they spend.", author: "Unknown" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
  { text: "Real estate is not just about property. It's about people, timing, and persistence.", author: "Unknown" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The pain of discipline is nothing compared to the pain of regret.", author: "Unknown" },
  { text: "Move fast. The deals you hesitate on are the deals someone else closes.", author: "Unknown" },
];

export default function MorningQuote() {
  // Rotate daily based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  return (
    <div className="morning-quote">
      <div className="morning-quote-text">"{quote.text}"</div>
      <div className="morning-quote-author">— {quote.author}</div>
    </div>
  );
}
