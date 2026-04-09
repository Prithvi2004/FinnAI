import React, { createContext, useState, useContext } from "react";

export interface FinancialDetails {
  monthlySalary: number;
  expenses: {
    rent: number;
    groceries: number;
    utilities: number;
    entertainment: number;
    miscellaneous: number;
  };
  lifeGoals: Array<{
    name: string;
    timeline: number;
    cost: number;
  }>;
  riskTolerance: "Low" | "Medium" | "High";
  investmentPreferences: string[];
  debt: {
    amount: number;
    interestRate: number;
    tenure: number;
  };
}

const defaultDetails: FinancialDetails = {
  monthlySalary: 0,
  expenses: {
    rent: 0,
    groceries: 0,
    utilities: 0,
    entertainment: 0,
    miscellaneous: 0,
  },
  lifeGoals: [],
  riskTolerance: "Medium",
  investmentPreferences: [],
  debt: {
    amount: 0,
    interestRate: 0,
    tenure: 0,
  },
};

interface FinancialContextType {
  summaryStatement: string | null;
  setSummaryStatement: (statement: string) => void;
  financialDetails: FinancialDetails;
  setFinancialDetails: React.Dispatch<React.SetStateAction<FinancialDetails>>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(
  undefined
);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [summaryStatement, setSummaryStatement] = useState<string | null>(null);
  const [financialDetails, setFinancialDetails] = useState<FinancialDetails>(defaultDetails);

  return (
    <FinancialContext.Provider
      value={{ summaryStatement, setSummaryStatement, financialDetails, setFinancialDetails }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancialContext() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error(
      "useFinancialContext must be used within a FinancialProvider"
    );
  }
  return context;
}
