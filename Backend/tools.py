import os
import yfinance as yf
import matplotlib
matplotlib.use('Agg')  # Use a non-interactive backend
import matplotlib.pyplot as plt 
from textblob import TextBlob
import requests
import numpy as np
import pandas as pd
from crewai_tools import ScrapeWebsiteTool, SerperDevTool
from crewai.tools import BaseTool

# Initialize Environment Variables
docs_scrape_tool = ScrapeWebsiteTool()
search_tool = SerperDevTool()
scrape_tool = ScrapeWebsiteTool()


# 1️⃣ Current Stock Price Tool
class GetCurrentStockPriceTool(BaseTool):
    name: str = "Get Current Stock Price"
    description: str = "Fetches the latest closing price of a given stock symbol."

    def _run(self, stock_symbol: str) -> float:
        try:
            stock = yf.Ticker(stock_symbol)
            current_price = stock.history(period="1d")['Close'].iloc[-1]
            return current_price
        except Exception as e:
            return f"Error fetching stock price: {e}"


get_current_stock_price_tool = GetCurrentStockPriceTool()


# 2️⃣ Stock Trend Visualization Tool
class PlotStockTrendTool(BaseTool):
    name: str = "Plot Stock Trend"
    description: str = "Generates and saves a trend chart of the stock for a given period."

    def _run(self, stock_symbol: str, period: str = "1mo") -> str:
        try:
            stock = yf.Ticker(stock_symbol)
            data = stock.history(period=period)
            plt.figure(figsize=(10, 6))
            plt.plot(data.index, data['Close'], label=f"{stock_symbol} Close Price", color='blue')
            plt.title(f"{stock_symbol} Stock Price Trend")
            plt.xlabel("Date")
            plt.ylabel("Price (INR)")
            plt.legend()
            plt.grid(True)
            filename = f"{stock_symbol}_trend.png"
            plt.savefig(filename)
            plt.close()
            return f"Trend chart saved as {filename}"
        except Exception as e:
            return f"Error plotting stock trend: {e}"


plot_stock_trend_tool = PlotStockTrendTool()


# 3️⃣ News Sentiment Analysis Tool
class AnalyzeNewsSentimentTool(BaseTool):
    name: str = "Analyze News Sentiment"
    description: str = "Analyzes the sentiment of the latest news articles about a stock."

    def _run(self, stock_symbol: str) -> float:
        try:
            api_key = "400c125b407d7e3b9d868717135713f6079485f9"
            url = "https://google.serper.dev/search"
            params = {
                "q": f"{stock_symbol} latest news",
                "gl": "in",
                "hl": "en",
                "num": 5
            }
            headers = {
                "X-API-KEY": api_key,
                "Content-Type": "application/json"
            }
            response = requests.post(url, json=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            sentiments = [
                TextBlob(result.get("title", "")).sentiment.polarity
                for result in data.get("news", {}).get("results", [])
            ]
            avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
            return avg_sentiment
        except Exception as e:
            return f"Error analyzing news sentiment: {e}"


analyze_news_sentiment_tool = AnalyzeNewsSentimentTool()


# 4️⃣ Portfolio Optimization Tool
class OptimizePortfolioTool(BaseTool):
    name: str = "Optimize Portfolio"
    description: str = "Optimizes stock allocation for maximum returns and balanced risk."

    def _run(self, stocks: list, initial_capital: float) -> dict:
        try:
            data = yf.download([f"{stock}.NS" for stock in stocks], period="1y", auto_adjust=True)
            data.dropna(axis=1, how='all', inplace=True)
            close_data = data['Close'].dropna(axis=1, how='all')

            returns = close_data.pct_change().dropna()
            cov_matrix = returns.cov()
            weights = np.random.random(len(returns.columns))
            weights /= np.sum(weights)

            portfolio_return = np.dot(weights, returns.mean()) * 252
            portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * np.sqrt(252)

            return {
                "weights": dict(zip(returns.columns, weights)),
                "expected_return": portfolio_return,
                "volatility": portfolio_volatility
            }
        except Exception as e:
            return f"Error optimizing portfolio: {e}"


optimize_portfolio_tool = OptimizePortfolioTool()


# 5️⃣ Loan Repayment Calculator Tool
class LoanRepaymentCalculatorTool(BaseTool):
    name: str = "Loan Repayment Calculator"
    description: str = "Calculates monthly EMI, total payment, and total interest for a loan."

    def _run(self, loan_amount: float, interest_rate: float, tenure_years: int) -> dict:
        try:
            monthly_interest_rate = (interest_rate / 100) / 12
            tenure_months = tenure_years * 12
            emi = (loan_amount * monthly_interest_rate * (1 + monthly_interest_rate) ** tenure_months) / \
                  ((1 + monthly_interest_rate) ** tenure_months - 1)
            total_payment = emi * tenure_months
            total_interest = total_payment - loan_amount
            return {
                "monthly_emi": round(emi, 2),
                "total_payment": round(total_payment, 2),
                "total_interest": round(total_interest, 2)
            }
        except Exception as e:
            return f"Error calculating loan repayment plan: {e}"


loan_repayment_calculator_tool = LoanRepaymentCalculatorTool()


# 6️⃣ Budget Prioritization Tool
class PrioritizeExpensesTool(BaseTool):
    name: str = "Prioritize Expenses"
    description: str = "Categorizes expenses based on priority and calculates remaining income."

    def _run(self, income: float, expenses: dict, goals: list) -> dict:
        try:
            total_expenses = sum(expenses.values())
            remaining_income = income - total_expenses
            prioritized_expenses = {
                category: {
                    "amount": amount,
                    "priority": "High" if category in goals else "Medium"
                }
                for category, amount in expenses.items()
            }
            return {
                "prioritized_expenses": prioritized_expenses,
                "remaining_income": remaining_income
            }
        except Exception as e:
            return f"Error prioritizing expenses: {e}"


prioritize_expenses_tool = PrioritizeExpensesTool()


# 7️⃣ Goal-Based Savings Planner Tool
class PlanSavingsForGoalsTool(BaseTool):
    name: str = "Plan Savings for Goals"
    description: str = "Generates a savings plan for specific financial goals within a timeline."

    def _run(self, goals: dict, timeline_years: int, monthly_income: float) -> dict:
        try:
            savings_plan = {
                goal: {
                    "required_monthly_savings": round(cost / (timeline_years * 12), 2),
                    "feasibility": "Feasible" if (cost / (timeline_years * 12)) <= monthly_income else "Not Feasible"
                }
                for goal, cost in goals.items()
            }
            return savings_plan
        except Exception as e:
            return f"Error planning savings for goals: {e}"


plan_savings_for_goals_tool = PlanSavingsForGoalsTool()


# 8️⃣ Risk Assessment Tool
class AssessRiskTool(BaseTool):
    name: str = "Assess Risk"
    description: str = "Assesses the risk of a portfolio based on user-defined risk tolerance."

    def _run(self, portfolio: dict, risk_tolerance: str) -> dict:
        try:
            risk_levels = {"Low": 0.05, "Medium": 0.1, "High": 0.2}
            max_volatility = risk_levels.get(risk_tolerance, 0.1)
            portfolio_volatility = portfolio.get("volatility", 0)

            return {
                "risk_level": "Within Tolerance" if portfolio_volatility <= max_volatility else "Exceeds Tolerance",
                "portfolio_volatility": portfolio_volatility,
                "max_allowed_volatility": max_volatility
            }
        except Exception as e:
            return f"Error assessing risk: {e}"


assess_risk_tool = AssessRiskTool()


# Export tools using _all_
__all__ = [
    "docs_scrape_tool",
    "search_tool" ,
    "scrape_tool",
    "get_current_stock_price_tool",
    "plot_stock_trend_tool",
    "analyze_news_sentiment_tool",
    "optimize_portfolio_tool",
    "loan_repayment_calculator_tool",
    "prioritize_expenses_tool",
    "plan_savings_for_goals_tool",
    "assess_risk_tool"
]