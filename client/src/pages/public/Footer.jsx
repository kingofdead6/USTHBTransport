import { motion } from "framer-motion";

const creators = [
  "John Doe",
  "Jane Smith",
  "Alex Johnson",
  // Add more names here
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm mb-3 text-slate-500">Made by</p>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {creators.map((name, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-slate-300 hover:text-white transition-colors"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}