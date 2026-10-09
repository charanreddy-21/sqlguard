# SQLGuard 🛡️

### ML-Powered SQL Injection Detection & Security Analytics

**SQLGuard** is an ML-powered security platform designed to detect suspicious SQL queries, evaluate detection models against different SQL injection techniques, and provide insights through a security analytics dashboard.

The project combines **Natural Language Processing (NLP), Machine Learning, Backend Engineering, Database Systems, and Security Analytics** to explore how ML-based detection can complement established SQL injection defenses.

> **Project status:** Initial development — dataset exploration and ML pipeline development.

---

## 🎯 Project Objectives

- Build a reproducible machine learning pipeline for SQL injection detection.
- Compare traditional ML models and text feature-extraction techniques.
- Evaluate detection performance across different attack techniques and query variations.
- Expose trained models through a REST API.
- Store prediction results and generate security analytics.
- Build an interactive dashboard for query analysis and attack monitoring.
- Explore a RAG-based security intelligence assistant as a future extension.

## 🏗️ Proposed Architecture

```text
                  SQLGuard Platform
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
       React Frontend           ML Pipeline
             │                       │
             ▼                       ▼
          FastAPI              Data Processing
             │                       │
             ▼                       ▼
        ML Inference          TF-IDF Features
             │                       │
             ▼                       ▼
        PostgreSQL            ML Classifier
             │                       │
             └───────────┬───────────┘
                         ▼
                Security Analytics
                         │
                         ▼
                  Future RAG Assistant
```

The architecture will evolve as individual components are implemented and evaluated.

## 🧠 Machine Learning & NLP

SQLGuard will initially focus on **traditional machine learning for text classification**.

### Planned ML Pipeline

1. **Dataset exploration:** Inspect labels, query structure, missing values, duplicates, and attack metadata.
2. **Data preparation:** Validate records and prepare appropriate training and evaluation splits.
3. **Feature extraction:** Convert SQL queries into numerical representations.
4. **Model training:** Train and compare classification models.
5. **Evaluation:** Measure detection performance, generalization, and inference cost.
6. **Model serving:** Integrate the selected model into the FastAPI backend.

### Feature Extraction

- **Character-level TF-IDF:** Captures character patterns, SQL operators, quotes, comments, and variations in query syntax.
- **Word-level TF-IDF:** Captures SQL keywords and combinations of tokens.
- **N-grams:** Represents sequences of characters or tokens as features.

### Planned Models

| Model                                   | Purpose                                           |
| --------------------------------------- | ------------------------------------------------- |
| Logistic Regression                     | Simple, interpretable baseline                    |
| Linear SVM                              | Strong baseline for sparse text features          |
| One-Class SVM / other anomaly detectors | Explore detection using benign-only training data |
| Transformer-based classifier            | Advanced comparison if justified by results       |

The initial experiments will compare character and word TF-IDF representations with traditional classifiers before exploring more complex approaches.

### Evaluation Metrics

- Precision
- Recall
- F1-score
- Confusion matrix
- False-positive and false-negative rates
- Inference latency
- Generalization to unseen query templates and attack variations

Evaluation will focus on more than accuracy, since missing malicious queries and incorrectly flagging legitimate queries have different security implications.

## 📊 Dataset

The initial research dataset under consideration is:

**[Superviz25-SQL — Zenodo](https://zenodo.org/records/17086037)**

The dataset contains SQL queries and metadata intended for research on SQL injection detection, including benign traffic, malicious traffic, attack techniques, and query-template information.

The dataset will be inspected and validated before the final experimental setup is established.

### Data Management

- Original datasets will remain unchanged.
- Raw and processed datasets will be excluded from Git.
- Data-cleaning and preprocessing scripts will be version-controlled.
- Dataset provenance, version, license, and preprocessing decisions will be documented.
- Evaluation splits will be designed to reduce data leakage, including leakage caused by related query templates.

See `docs/dataset.md` for dataset details as the project progresses.

## ⚙️ Technology Stack

### Machine Learning & NLP

- Python
- pandas
- NumPy
- scikit-learn
- TF-IDF vectorization
- Character and word n-grams

### Backend

- FastAPI
- Pydantic
- Uvicorn
- SQLAlchemy

### Database & Caching

- PostgreSQL
- Redis — planned for caching and rate limiting

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts

### Development & Deployment

- Git and GitHub
- Jupyter Notebook
- pytest
- Docker — planned

### Future AI Extension

- PostgreSQL with pgvector
- Embeddings and retrieval-augmented generation (RAG)
- Large language model integration

*The stack describes current choices and planned technologies; not every component has been implemented yet.*

## 🖥️ Planned Application Features

### 1. Query Analyzer

Submit a SQL query and inspect the model's prediction, risk score, and available classification details.

### 2. Security Dashboard

Display request statistics, detected suspicious queries, attack trends, and relevant model evaluation metrics.

### 3. Attack Logs

Store prediction events and support filtering, searching, and reviewing recorded results.

### 4. ML Analytics

Compare models, analyze false positives and false negatives, and investigate which attack categories are difficult to detect.

### 5. Model Management

Track model versions, evaluation results, and inference performance.

### 6. Security Intelligence Assistant — Future

Use structured analytics and retrieved security documentation to answer questions such as:

- Which attack categories are hardest for the current model to detect?
- What kinds of query variations produce false negatives?
- How do different models compare in recall and inference latency?
- What security practices help prevent SQL injection?

Analytical questions will use computed database results where appropriate; RAG will support retrieving and explaining relevant documentation.

## 🔐 Security Considerations

SQLGuard is an experimental detection and monitoring platform, not a replacement for secure database development.

The project will follow these principles:

- Use parameterized queries and prepared statements for database operations.
- Validate API inputs and apply appropriate authentication and authorization.
- Avoid exposing sensitive query contents in logs or responses.
- Treat ML predictions as probabilistic signals rather than proof of malicious intent.
- Evaluate false positives and false negatives before using predictions to influence security decisions.

**ML-based detection should complement established security controls, not replace them.**

## 🗺️ Development Roadmap

- Initialize repository and project structure
- Document dataset source and schema
- Explore dataset characteristics and label distribution
- Implement data validation and preprocessing
- Establish a reproducible train/validation/test strategy
- Train baseline TF-IDF + Logistic Regression model
- Compare character and word n-grams
- Evaluate Linear SVM and other suitable baselines
- Analyze performance across attack categories
- Investigate generalization to unseen query templates
- Build FastAPI inference endpoints
- Integrate PostgreSQL prediction logging
- Build React security dashboard
- Add authentication and rate limiting
- Containerize and deploy the application
- Explore anomaly detection and transformer-based models
- Add a RAG-based security intelligence assistant

## 📁 Initial Repository Structure

```text
sqlguard/
├── data/
│   ├── raw/
│   ├── interim/
│   └── processed/
├── notebooks/
├── src/
│   └── sqlguard/
│       └── data/
├── tests/
├── reports/
│   └── figures/
├── docs/
├── .gitignore
└── README.md
```

The repository will grow as the ML pipeline, backend, frontend, and deployment components are introduced.

## 🤝 Development Approach

SQLGuard is being developed incrementally, with emphasis on:

- Reproducible experiments
- Clear documentation
- Meaningful Git commits
- Modular and testable code
- Evidence-based model selection
- Explicit tracking of limitations and design decisions

## ⚠️ Disclaimer

SQLGuard is a research and educational project. Its effectiveness will depend on the data, evaluation methodology, and deployment environment. It does not guarantee detection of all SQL injection attacks and should not be used as the sole security mechanism for production systems.

---

**SQLGuard — Detect. Evaluate. Understand.**
