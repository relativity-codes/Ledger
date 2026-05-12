# Ledger AI Workflow - Mermaid Diagrams

Here are the complete workflow diagrams for Ledger's AI processing pipeline, from user input to database storage.

---

## 1. Complete End-to-End AI Workflow

```mermaid
flowchart TD

    Start([User Input]) --> InputType{Input Type}

    InputType -->|Voice| Voice[Voice Recording]
    InputType -->|Image| Image[Camera Capture]
    InputType -->|SMS| SMS[SMS Alert]
    InputType -->|Manual| Manual[Text Input]

    %% Voice Path
    Voice --> Record["Record Audio"]
    Record --> ASR["Vosk ASR"]
    ASR --> Text["Raw Text"]

    %% Image Path
    Image --> OCR["TFLite OCR"]
    OCR --> ImageText["Extracted Text"]
    ImageText --> Text

    %% SMS Path
    SMS --> SMSFilter["Bank Keyword Filter"]
    SMSFilter --> SMSRaw["SMS Body Text"]
    SMSRaw --> Text

    %% Manual Path
    Manual --> Text

    %% Common Processing
    Text --> Preprocess["Text Preprocessing"]

    Preprocess --> GemmaPrompt["Build Gemma 4 Prompt"]

    GemmaPrompt --> GemmaInference["Gemma 4 Inference"]

    GemmaInference --> ParseJSON["JSON Response Parser"]

    ParseJSON --> Validation{Validation Check}

    Validation -->|Invalid| Retry["Retry with fallback prompt"]

    Retry --> GemmaInference

    Validation -->|Valid| DuplicateCheck{"Duplicate Check"}

    DuplicateCheck -->|Duplicate| Reject["Reject Entry"]

    DuplicateCheck -->|Clean| Structured["Structured Entry"]

    Structured --> LedgerEngine["Ledger Engine"]

    LedgerEngine --> DB[(SQLite Database)]

    DB --> UpdateBalance["Update Balance"]

    UpdateBalance --> AnomalyCheck{"Anomaly Detection"}

    AnomalyCheck -->|Yes| AnomalyAlert["Anomaly Alert"]

    AnomalyCheck -->|No| Continue["Continue"]

    AnomalyAlert --> TTS

    Continue --> TTS["Piper TTS"]

    TTS --> End([User Hears Confirmation])

    Reject --> End
```

---

## 2. Detailed Gemma 4 E2B Processing Pipeline

```mermaid
flowchart LR

    subgraph Input["Input Processing"]
        A[User Raw Text]
        A --> B["System Prompt<br/>You are Ledger"]
        B --> C["Template Insertion<br/>Extraction instructions"]
    end

    subgraph Model["Gemma 4 E2B (2B active params)"]
        C --> D["Tokenization<br/>~200 input tokens"]
        D --> E["Transformer Layers<br/>26 layers × 2B params"]
        E --> F["Sampling<br/>Temperature: 0.2<br/>Top-P: 0.9"]
        F --> G["Decoding<br/>~52 tokens/sec"]
    end

    subgraph Output["Output Processing"]
        G --> H[JSON Extraction]
        H --> I{Valid JSON?}
        I -->|Yes| J[Parse to Object]
        I -->|No| K[Regex Fallback]
        K --> J
        J --> L[Structured Entry]
    end

    L --> M[Ledger Engine]
```

---

## 3. Multimodal Input Routing

```mermaid
flowchart TD

    Input[User Intent] --> Router{Input Router}

    Router -->|Voice Command| V1[Microphone Active]
    V1 --> V2["Vosk ASR<br/>Real-time transcription"]
    V2 --> V3["Speech to Text"]
    V3 --> Common

    Router -->|Take Photo| C1[Camera Opens]
    C1 --> C2[Capture Image]
    C2 --> C3["TFLite OCR<br/>Text detection"]
    C3 --> C4["OCR to Text"]
    C4 --> Common

    Router -->|SMS Alert| S1[SMS Listener]
    S1 --> S2[Filter Bank Keywords]
    S2 --> S3["SMS to Text"]
    S3 --> Common

    Router -->|Manual Entry| M1[Text Input Modal]
    M1 --> M2[User Types]
    M2 --> Common

    subgraph Common["Gemma 4 Extraction Pipeline (Shared)"]
        direction LR

        E1[Raw Text]
        E1 --> E2[Prompt Engineering]
        E2 --> E3[Gemma 4 Inference]
        E3 --> E4[JSON Parsing]
        E4 --> E5[Validation]
    end

    Common --> Save[Save to Ledger]
```

---

## 4. Natural Language Query Processing

```mermaid
flowchart TD

    Query["User Query<br/>How much did I spend last week?"]
        --> TTS1["Optional Voice Input<br/>Vosk ASR"]

    TTS1 --> TextQuery[Text Query]

    TextQuery --> BuildPrompt[Build SQL Prompt]

    subgraph GemmaSQL["Gemma 4 to SQL WHERE Clause"]
        BuildPrompt --> SQLPrompt["Prompt<br/>Convert to SQLite WHERE clause"]

        SQLPrompt --> GemmaInfer["Gemma 4 Inference<br/>temperature: 0.1"]

        GemmaInfer --> WhereClause["WHERE clause<br/>type = expense AND timestamp >= last 7 days"]
    end

    WhereClause --> BuildQuery["Build Full SQL Query"]

    BuildQuery --> Execute[("SQLite Query<br/>with FTS5 index")]

    Execute --> Results[Query Results Array]

    Results --> BuildSummary[Build Summary Prompt]

    subgraph GemmaSummary["Gemma 4 to Natural Language"]
        BuildSummary --> SummaryPrompt["Prompt<br/>Summarize these transactions"]

        SummaryPrompt --> GemmaSumInfer["Gemma 4 Inference<br/>temperature: 0.3"]

        GemmaSumInfer --> SummaryText["Summary<br/>You spent 1200 rupees on food last week"]
    end

    SummaryText --> TTS2["Piper TTS<br/>Spoken Response"]

    TTS2 --> User[User Hears Answer]
```

---

## 5. Anomaly Detection Flow

```mermaid
flowchart LR

    subgraph Trigger["When New Expense Added"]
        A[New Entry]
        A --> B["Entry type is expense?"]
        B -->|No| End1([Skip])
        B -->|Yes| C[Get Category]
    end

    subgraph Analysis["On-Device Statistical Analysis"]
        C --> D["Query last 7 days<br/>same category"]

        D --> E["Calculate<br/>Average<br/>Standard deviation<br/>Count"]

        E --> F["Amount > average × 1.3<br/>AND amount > 100?"]
    end

    subgraph Alert["Alert Generation"]
        F -->|Yes| G["Create Anomaly Object"]

        F -->|No| End2([No Alert])

        G --> H[Display Alert Banner]

        H --> I["TTS Spoken Alert<br/>Spent 30% more on food than usual"]
    end

    I --> J["User Action<br/>Acknowledge or mark as expected"]
```

---

## 6. Credit Customer Tracking Workflow

```mermaid
flowchart TD

    subgraph AddCustomer["Add Credit Customer"]
        Voice1["Add customer Ramesh"]
            --> ASR1[Vosk ASR]

        ASR1 --> Extract1["Gemma 4 extraction"]

        Extract1 --> Customer[(credit_customers table)]
    end

    subgraph RecordDebt["Record Debt"]
        Voice2["Ramesh bought 200 rice on credit"]
            --> ASR2[Vosk ASR]

        ASR2 --> Extract2["Gemma 4 extraction<br/>amount: 200<br/>customer: Ramesh"]

        Extract2 --> Lookup{Find Customer ID}

        Lookup -->|Found| CreateDebt["Insert credit transaction"]

        Lookup -->|Not Found| Prompt["Ask user to add customer first"]

        CreateDebt --> UpdateOwed["Update customer total owed"]
    end

    subgraph RecordPayment["Record Payment"]
        Voice3["Ramesh paid 200"]
            --> ASR3[Vosk ASR]

        ASR3 --> Extract3["Gemma 4 extraction"]

        Extract3 --> MarkPaid["Update transaction status to paid"]

        MarkPaid --> UpdatePaid["Update total paid and total owed"]
    end

    subgraph Query["Query Credit"]
        Voice4["How much does Ramesh owe?"]
            --> ASR4[Vosk ASR]

        ASR4 --> QueryDB["Select total owed from customer"]

        QueryDB --> TTS["Spoken Response<br/>Ramesh owes 200 rupees"]
    end
```

---

## 7. Model Loading & Memory Management

```mermaid
flowchart TD

    Start([App Launch]) --> CheckModel{Model Downloaded?}

    CheckModel -->|No| Download["Download from Play Asset Delivery<br/>2.58 GB Gemma 4 E2B task file"]

    Download --> ShowProgress["Show Progress Bar<br/>Resume on interrupt"]

    ShowProgress --> WaitDownload["Wait for completion<br/>Recommend WiFi"]

    CheckModel -->|Yes| LoadModels

    WaitDownload --> LoadModels

    subgraph LoadModels["Model Loading Sequence"]
        LoadModels --> LoadGemma["Load Gemma 4 E2B<br/>react-native-litert-lm"]

        LoadGemma --> LoadVosk["Load Vosk ASR<br/>50 MB model"]

        LoadVosk --> LoadOCR["Load TFLite OCR<br/>3 MB model"]

        LoadOCR --> LoadTTS["Load Piper TTS<br/>5 MB model"]
    end

    LoadTTS --> WarmUp["Pre-warm Gemma 4<br/>Send minimal prompt"]

    WarmUp --> Ready["App Ready<br/>Total RAM approximately 1.5 GB"]

    Ready --> UserInteraction[User Interaction]

    UserInteraction --> Monitor{Memory Monitor}

    Monitor -->|RSS > 1.4 GB| Warning["Show memory warning<br/>Suggest restart"]

    Monitor -->|Normal| Continue[Continue]

    Warning --> UserRestart{User restarts?}

    UserRestart -->|Yes| Start

    UserRestart -->|No| Continue
```

---

## 8. Fallback & Error Recovery Chain

```mermaid
flowchart TD

    Start[Extraction Attempt]
        --> Primary["Primary<br/>Gemma 4 E2B"]

    Primary --> PrimaryOK{Success?}

    PrimaryOK -->|Yes| Save[Save to Ledger]

    PrimaryOK -->|No| Retry1["Retry 1<br/>Lower temperature 0.1"]

    Retry1 --> Retry1OK{Success?}

    Retry1OK -->|Yes| Save

    Retry1OK -->|No| Retry2["Retry 2<br/>Simplified prompt"]

    Retry2 --> Retry2OK{Success?}

    Retry2OK -->|Yes| Save

    Retry2OK -->|No| Fallback1["Fallback 1<br/>Regex extraction"]

    Fallback1 --> Fallback1OK{Extracted?}

    Fallback1OK -->|Yes with low confidence| Confirm["Show user confirmation"]

    Confirm --> UserOK{User confirms?}

    UserOK -->|Yes| Save

    UserOK -->|No| Fallback2

    Fallback1OK -->|No| Fallback2["Fallback 2<br/>Manual entry modal"]

    Fallback2 --> UserTypes["User manually enters<br/>Amount<br/>Type<br/>Category"]

    UserTypes --> SaveWithFlag["Save with source = manual<br/>Flag for review"]

    Save --> End([Complete])

    SaveWithFlag --> End
```

---

## 9. Database Query Execution with FTS5

```mermaid
flowchart TD

    Query[User Natural Language Query]
        --> GemmaSQL["Gemma 4 to SQL WHERE"]

    GemmaSQL --> WhereClause["WHERE clause<br/>type = expense AND category = food"]

    WhereClause --> BuildSQL["SELECT * FROM events WHERE type = expense"]

    subgraph SQLite["SQLite Query Engine"]
        BuildSQL --> Parser[SQL Parser]

        Parser --> Optimizer[Query Optimizer]

        Optimizer --> ChooseIndex{Choose Index}

        ChooseIndex -->|Time range| TimeIndex[(idx_events_timestamp)]

        ChooseIndex -->|Category| TypeIndex[(idx_events_type_category)]

        ChooseIndex -->|Text search| FTSIndex[(events_fts FTS5)]

        TimeIndex --> Execute[Execute Query]
        TypeIndex --> Execute
        FTSIndex --> Execute
    end

    Execute --> Results[Result Set]

    Results --> Format[Format Results]

    Format --> GemmaSum["Gemma 4 Summarization"]

    GemmaSum --> TTS[Spoken Output]
```

---

## 10. Complete System Component Interaction

```mermaid
flowchart TD

    subgraph UI["User Interface Layer (React Native)"]
        VoiceScreen[Voice Entry Screen]
        CameraScreen[Camera Screen]
        LedgerScreen[Ledger View Screen]
        CreditScreen[Credit Management]
    end

    subgraph Services["Service Layer (TypeScript)"]
        InputRouter[Input Router]
        LedgerEngine[Ledger Engine]
        QueryEngine[Query Engine]
        AnomalyDetector[Anomaly Detector]
    end

    subgraph Native["Native AI Layer (Kotlin/C++)"]
        LiteRTLM["react-native-litert-lm<br/>Gemma 4 E2B"]

        Vosk["Vosk<br/>Speech-to-Text"]

        TFLite["TensorFlow Lite<br/>OCR"]

        Piper[Piper TTS]
    end

    subgraph Data["Data Layer"]
        SQLite[(SQLite Database)]
        FTS5[(FTS5 Virtual Table)]
    end

    VoiceScreen -->|Audio| Vosk
    Vosk -->|Text| InputRouter

    CameraScreen -->|Image| TFLite
    TFLite -->|Text| InputRouter

    InputRouter -->|Text prompts| LiteRTLM
    LiteRTLM -->|JSON| LedgerEngine

    LedgerEngine -->|Write| SQLite
    SQLite -->|Sync| FTS5

    LedgerScreen -->|Query| QueryEngine

    CreditScreen -->|Credit ops| LedgerEngine
    CreditScreen -->|Queries| QueryEngine

    QueryEngine -->|SQL WHERE prompt| LiteRTLM
    LiteRTLM -->|WHERE clause| SQLite

    SQLite -->|Results| QueryEngine

    QueryEngine -->|Summary prompt| LiteRTLM

    LiteRTLM -->|Summary| Piper

    AnomalyDetector -->|Read| SQLite
    AnomalyDetector -->|Alert| VoiceScreen

    Piper -->|Audio| VoiceScreen
```


These diagrams represent the complete AI workflow for Ledger. The key architectural decisions visualized include:

1. **Sequential processing** - Voice/Image/SMS all route through Gemma 4 for extraction
2. **Fallback chains** - Multiple retry strategies before manual entry
3. **Shared inference engine** - Gemma 4 handles both extraction AND query-to-SQL
4. **FTS5 for search** - SQLite's full-text search for fast natural language queries
5. **Anomaly detection** - Lightweight statistical analysis, no LLM needed
6. **Memory monitoring** - Critical for low-end device stability

Would you like me to create any additional diagrams for specific sub-systems, such as the Bluetooth backup flow or the credit readiness score calculation?