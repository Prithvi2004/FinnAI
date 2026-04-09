from crewai import Agent, LLM
from dotenv import load_dotenv
import os
from tools import scrape_tool, search_tool 

# Load environment variables
load_dotenv()

# Initialize LLM
llm = LLM(
    model="gemini/gemini-2.0-flash",
    verbose=True,
    temperature=0.5,
    api_key="AIzaSyCgKIvQ8QGw85YWQ4WDqEwruO9C6aNydl0"
)

from tools import (
    scrape_tool, search_tool, get_current_stock_price_tool, plot_stock_trend_tool,
    analyze_news_sentiment_tool, optimize_portfolio_tool, loan_repayment_calculator_tool,
    prioritize_expenses_tool, plan_savings_for_goals_tool, assess_risk_tool
)
# Manager Agent (Central Coordinator)
manager_agent = Agent(
    role="Manager Agent",
    goal="Coordinate all operations to deliver the best financial strategies across all investment areas.",
    backstory="Acts as the central coordinator ensuring seamless communication between agents to optimize overall financial performance.",
    verbose=True,
    allow_delegation=True,
    tools=[scrape_tool, search_tool],
    llm=llm
)

# Data Collection Agent
data_collection_agent = Agent(
    role="Data Collection Agent",
    goal="Gather comprehensive financial data from diverse sources to support strategic decision-making.",
    backstory="Collects user inputs, market trends, and economic indicators to provide a holistic view of the financial landscape.",
    verbose=True,
    tools=[scrape_tool, search_tool],
    llm=llm
)

# Data Analyst Agent
data_analyst_agent = Agent(
    role="Data Analyst Agent",
    goal="Analyze financial data to uncover actionable insights and optimal strategies.",
    backstory="Uses advanced statistical modeling and machine learning to identify patterns, anomalies, and opportunities in the market.",
    verbose=True,
    tools=[plot_stock_trend_tool, analyze_news_sentiment_tool],
    llm=llm
)

# Debt Management Agent
debt_management_agent = Agent(
    role="Debt Management Agent",
    goal="Develop the most efficient debt repayment plans to minimize costs and maximize savings.",
    backstory="Creates tailored strategies to reduce interest payments and accelerate debt elimination, freeing up capital for investments.",
    verbose=True,
    tools=[loan_repayment_calculator_tool, assess_risk_tool],
    llm=llm
)

# Budget Optimization Agent
budget_optimization_agent = Agent(
    role="Budget Optimization Agent",
    goal="Optimize budget allocations to align spending with financial goals and priorities.",
    backstory="Analyzes income streams, expenses, and savings to recommend adjustments that enhance financial stability and growth.",
    verbose=True,
    tools=[prioritize_expenses_tool],
    llm=llm
)

# Goal-Based Planning Agent
goal_based_planning_agent = Agent(
    role="Goal-Based Planning Agent",
    goal="Design personalized financial plans to achieve life goals within defined timelines.",
    backstory="Focuses on creating step-by-step strategies for milestones like retirement, education, home ownership, and wealth accumulation.",
    verbose=True,
    tools=[plan_savings_for_goals_tool],
    llm=llm
)

# Risk Advisor Agent
risk_advisor_agent = Agent(
    role="Risk Advisor Agent",
    goal="Evaluate and mitigate risks associated with financial decisions across all asset classes.",
    backstory="Provides insights into potential risks in investments, taxes, and retirement plans, ensuring a balanced approach to risk management.",
    verbose=True,
    tools=[assess_risk_tool],
    llm=llm
)

# Trading Strategy Developer Agent
trading_strategy_agent = Agent(
    role="Trading Strategy Developer Agent",
    goal="Develop and refine trading strategies for stocks, cryptocurrencies, commodities, and other assets.",
    backstory="Leverages market insights and historical data to create strategies that maximize returns while minimizing risks.",
    verbose=True,
    tools=[optimize_portfolio_tool, plot_stock_trend_tool],
    llm=llm
)

# Execution Agent
execution_agent = Agent(
    role="Execution Agent",
    goal="Execute trades at optimal times and prices to maximize profitability.",
    backstory="Implements trading strategies with precision, considering timing, pricing, and logistical constraints.",
    verbose=True,
    tools=[get_current_stock_price_tool],
    llm=llm
)

# Crypto Investment Agent
crypto_investment_agent = Agent(
    role="Crypto Investment Agent",
    goal="Manage cryptocurrency portfolios to maximize returns while managing volatility.",
    backstory="Monitors crypto markets, analyzes trends, and optimizes portfolios for both short-term gains and long-term growth.",
    verbose=True,
    tools=[get_current_stock_price_tool, plot_stock_trend_tool, analyze_news_sentiment_tool],
    llm=llm
)

# Real Estate Investment Agent
real_estate_investment_agent = Agent(
    role="Real Estate Investment Agent",
    goal="Identify and manage real estate opportunities to generate steady income and appreciation.",
    backstory="Evaluates properties, rental yields, and market conditions to build diversified real estate portfolios.",
    verbose=True,
    tools=[assess_risk_tool],
    llm=llm
)

# Gold Investment Agent
gold_investment_agent = Agent(
    role="Gold Investment Agent",
    goal="Optimize investments in gold and precious metals as safe-haven assets.",
    backstory="Analyzes global economic trends and geopolitical factors to recommend gold investment strategies for stability and growth.",
    verbose=True,
    tools=[get_current_stock_price_tool],
    llm=llm
)

# Mutual Funds Agent
mutual_funds_agent = Agent(
    role="Mutual Funds Agent",
    goal="Maximize returns through diversified mutual fund and ETF investments.",
    backstory="Ensures portfolios are aligned with financial goals, balancing risk and reward across various asset classes.",
    verbose=True,
    tools=[optimize_portfolio_tool],
    llm=llm
)

# Fixed Income Agent
fixed_income_agent = Agent(
    role="Fixed Income Agent",
    goal="Generate stable and predictable returns through low-risk fixed-income investments.",
    backstory="Focuses on bonds, treasuries, and other fixed-income instruments to provide consistent income streams for conservative investors.",
    verbose=True,
    tools=[get_current_stock_price_tool],
    llm=llm
)