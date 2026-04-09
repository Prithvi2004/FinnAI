import React, { useState } from "react";
import {
  BarChart as ChartBar,
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { useFinancialContext } from "../contexts/FinancialContext";
import { motion, AnimatePresence } from "framer-motion";
import { TiltCard } from "./TiltCard";

const investmentOptions = [
  "Stocks",
  "Real Estate",
  "Gold",
  "Mutual Funds",
  "Crypto",
  "Fixed Deposits",
  "Bonds",
];

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98,
    };
  },
};

export function FinancialDetailsForm({ onClose }: { onClose: () => void }) {
  const { setSummaryStatement, financialDetails: details, setFinancialDetails: setDetails } = useFinancialContext();

  const [[step, direction], setStep] = useState([0, 0]);
  const [showExpenses, setShowExpenses] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", timeline: 0, cost: 0 });
  const [uploadProgress, setUploadProgress] = useState(0);

  const paginate = (newDirection: number) => {
    setStep([step + newDirection, newDirection]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploadProgress(0), 1000);
        }
      }, 100);
    }
  };

  const addGoal = () => {
    if (newGoal.name && newGoal.timeline && newGoal.cost) {
      setDetails((prev) => ({
        ...prev,
        lifeGoals: [...prev.lifeGoals, newGoal],
      }));
      setNewGoal({ name: "", timeline: 0, cost: 0 });
    }
  };

  const handleSubmit = () => {
    const expensesSummary = Object.entries(details.expenses)
      .map(([key, value]) => `${key}: ₹${value}`)
      .join(", ");

    const lifeGoalsSummary = details.lifeGoals
      .map(
        (goal) =>
          `${goal.name} (Timeline: ${goal.timeline} years, Cost: ₹${goal.cost})`
      )
      .join(", ");

    const investmentPreferencesSummary =
      details.investmentPreferences.join(", ");

    const summaryStatement = `
      My monthly salary is ₹${details.monthlySalary}.
      My monthly expenses are: ${expensesSummary}.
      My life goals are: ${lifeGoalsSummary}.
      My risk tolerance is ${details.riskTolerance}.
      My investment preferences are: ${investmentPreferencesSummary}.
      My debt details are: Amount: ₹${details.debt.amount}, Interest Rate: ${details.debt.interestRate}%, Tenure: ${details.debt.tenure} years.
    `;

    setSummaryStatement(summaryStatement.trim());
    onClose();
  };

  const steps = [
    { title: "Income & Expenses", subtitle: "Let's establish your baseline" },
    { title: "Goals & Debt", subtitle: "Where are you heading?" },
    { title: "Investment Profile", subtitle: "Define your risk appetite" },
    { title: "Upload Data", subtitle: "Import your financial history" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-charcoal-950/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <TiltCard className="w-full max-w-2xl bg-charcoal-900 border-charcoal-800/50 p-0 shadow-2xl relative z-10 flex flex-col h-[75vh] md:h-[600px]">
        {/* Header */}
        <div className="p-8 border-b border-charcoal-800/30 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-warmGrey-400 hover:text-bronze transition-colors focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex space-x-2 mb-6">
            {steps.map((s, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full bg-charcoal-800 overflow-hidden">
                <motion.div 
                  initial={false}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  className="h-full bg-bronze"
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            ))}
          </div>

          <h2 className="text-3xl font-serif text-warmGrey-100">
            {steps[step].title}
          </h2>
          <p className="text-warmGrey-400 mt-1">{steps[step].subtitle}</p>
        </div>

        {/* Body */}
        <div className="flex-1 relative overflow-hidden bg-charcoal-900/40">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-charcoal-700"
              data-lenis-prevent="true"
            >
              {/* Step 1: Income */}
              {step === 0 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-warmGrey-400">
                      Monthly Salary
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warmGrey-500">&#8377;</span>
                      <input
                        type="number"
                        value={details.monthlySalary || ""}
                        onChange={(e) => setDetails((prev) => ({ ...prev, monthlySalary: +e.target.value }))}
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-bronze text-warmGrey-200 transition-all font-medium"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowExpenses(!showExpenses)}
                      className="w-full bg-charcoal-950/50 border border-charcoal-800 rounded-xl px-4 py-3 text-left hover:border-bronze/50 transition-all focus:outline-none"
                    >
                      <div className="flex items-center justify-between text-warmGrey-300">
                        <span className="font-medium">Monthly Expenses Breakdown</span>
                        <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${showExpenses ? "rotate-90 text-bronze" : ""}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {showExpenses && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4 pl-4 border-l-2 border-charcoal-800 overflow-hidden"
                        >
                          {Object.entries(details.expenses).map(([key, value]) => (
                            <div key={key}>
                              <label className="block text-xs font-medium text-warmGrey-500 mb-1 capitalize">
                                {key}
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warmGrey-600 text-sm">&#8377;</span>
                                <input
                                  type="number"
                                  value={value || ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, expenses: { ...prev.expenses, [key]: +e.target.value } }))}
                                  className="w-full bg-charcoal-950 border border-charcoal-800/50 rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-bronze text-warmGrey-200 text-sm transition-all"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Step 2: Goals */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-warmGrey-400 mb-4">
                      Life Goals
                    </label>
                    <div className="space-y-3 mb-4">
                      {details.lifeGoals.map((goal, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={index}
                          className="flex items-center bg-charcoal-950 border border-charcoal-800 rounded-xl p-4 text-sm text-warmGrey-300"
                        >
                          <span className="flex-1 font-medium">{goal.name}</span>
                          <span className="w-24 px-2 text-warmGrey-400">{goal.timeline} yrs</span>
                          <span className="w-24 px-2 text-bronze">&#8377;{goal.cost}</span>
                          <button onClick={() => setDetails((prev) => ({ ...prev, lifeGoals: prev.lifeGoals.filter((_, i) => i !== index) }))} className="text-red-400/50 hover:text-red-400 transition-colors ml-2">
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-charcoal-950/30 border border-charcoal-800/50 rounded-xl p-4 space-y-4">
                      <input
                        type="text"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Goal name (e.g. House)"
                        className="w-full bg-charcoal-950 border border-charcoal-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-bronze text-warmGrey-200"
                      />
                      <div className="flex space-x-3">
                        <input
                          type="number"
                          value={newGoal.timeline || ""}
                          onChange={(e) => setNewGoal((prev) => ({ ...prev, timeline: +e.target.value }))}
                          placeholder="Years"
                          className="flex-1 bg-charcoal-950 border border-charcoal-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-bronze text-warmGrey-200"
                        />
                        <input
                          type="number"
                          value={newGoal.cost || ""}
                          onChange={(e) => setNewGoal((prev) => ({ ...prev, cost: +e.target.value }))}
                          placeholder="Cost (&#8377;)"
                          className="flex-1 bg-charcoal-950 border border-charcoal-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-bronze text-warmGrey-200"
                        />
                        <button onClick={addGoal} className="px-4 py-2 bg-bronze text-charcoal-950 font-medium rounded-lg hover:bg-bronze-light text-sm transition-colors">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warmGrey-400 mb-4">
                      Current Debt
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        value={details.debt.amount || ""}
                        onChange={(e) => setDetails((prev) => ({ ...prev, debt: { ...prev.debt, amount: +e.target.value } }))}
                        placeholder="Amount"
                        className="bg-charcoal-950 border border-charcoal-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-bronze text-warmGrey-200"
                      />
                      <input
                        type="number"
                        value={details.debt.interestRate || ""}
                        onChange={(e) => setDetails((prev) => ({ ...prev, debt: { ...prev.debt, interestRate: +e.target.value } }))}
                        placeholder="Interest %"
                        className="bg-charcoal-950 border border-charcoal-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-bronze text-warmGrey-200"
                      />
                      <input
                        type="number"
                        value={details.debt.tenure || ""}
                        onChange={(e) => setDetails((prev) => ({ ...prev, debt: { ...prev.debt, tenure: +e.target.value } }))}
                        placeholder="Yrs"
                        className="bg-charcoal-950 border border-charcoal-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-bronze text-warmGrey-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Risk */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-warmGrey-400 mb-3">
                      Risk Tolerance
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Low", "Medium", "High"].map((level) => (
                        <button
                          key={level}
                          onClick={() => setDetails(prev => ({ ...prev, riskTolerance: level as any }))}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                            details.riskTolerance === level
                              ? "bg-bronze/10 border-bronze text-bronze"
                              : "bg-charcoal-950 border-charcoal-800 text-warmGrey-400 hover:border-bronze/50"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warmGrey-400 mb-3">
                      Investment Preferences
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {investmentOptions.map((option) => {
                        const isSelected = details.investmentPreferences.includes(option);
                        return (
                          <button
                            key={option}
                            onClick={() =>
                              setDetails((prev) => ({
                                ...prev,
                                investmentPreferences: isSelected
                                  ? prev.investmentPreferences.filter((p) => p !== option)
                                  : [...prev.investmentPreferences, option],
                              }))
                            }
                            className={`px-4 py-2 rounded-full text-sm transition-all border ${
                              isSelected
                                ? "bg-bronze text-charcoal-950 border-bronze font-medium"
                                : "bg-charcoal-950 border-charcoal-800 text-warmGrey-400 hover:border-bronze/50"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Upload */}
              {step === 3 && (
                <div className="space-y-8 flex flex-col items-center justify-center h-full pb-8">
                  <div className="w-full relative group">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".csv,.json"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="w-full border-2 border-dashed border-charcoal-700 bg-charcoal-950/50 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-bronze hover:bg-bronze/5 transition-all duration-300 group"
                    >
                      {uploadProgress === 0 ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-charcoal-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-bronze" />
                          </div>
                          <h3 className="text-lg font-medium text-warmGrey-200 mb-1">Upload Financial Data</h3>
                          <p className="text-sm text-warmGrey-500">Drag & drop your CSV or JSON here</p>
                        </>
                      ) : uploadProgress >= 100 ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-medium text-warmGrey-200">Upload Complete!</h3>
                        </>
                      ) : (
                        <div className="w-full max-w-xs space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-warmGrey-300">Uploading...</span>
                            <span className="text-bronze font-medium">{uploadProgress}%</span>
                          </div>
                          <div className="h-2 w-full bg-charcoal-800 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-bronze"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="p-6 border-t border-charcoal-800/30 flex items-center justify-between shrink-0 bg-charcoal-900 border-t-charcoal-800 rounded-b-xl">
          <button
            onClick={() => paginate(-1)}
            disabled={step === 0}
            className="flex items-center px-4 py-2 text-warmGrey-400 hover:text-warmGrey-100 disabled:opacity-0 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => paginate(1)}
              className="flex items-center px-6 py-2.5 bg-warmGrey-100 text-charcoal-950 font-medium rounded-lg hover:bg-white transition-colors"
            >
              Continue <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center px-6 py-2.5 bg-bronze text-charcoal-950 font-medium rounded-lg hover:bg-bronze-light shadow-lg shadow-bronze/20 hover:shadow-bronze/40 transition-all"
            >
              Complete Profile <CheckCircle2 className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </TiltCard>
    </div>
  );
}
