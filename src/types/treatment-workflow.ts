/**
 * Treatment Workflow Types for IUI and IVF
 * Comprehensive data structures for tracking detailed treatment protocols
 */

// ============================================================================
// Common Types
// ============================================================================

export type CycleStatus =
  | "Planned"
  | "COS" // Controlled Ovarian Stimulation
  | "OPU" // Oocyte Pickup
  | "Fert" // Fertilization
  | "Culture" // Embryo Culture
  | "ET" // Embryo Transfer
  | "FET" // Frozen Embryo Transfer
  | "Preg+" // Pregnancy Positive
  | "Preg-" // Pregnancy Negative
  | "Closed"; // Cycle Closed

// ============================================================================
// IUI Workflow Types
// ============================================================================

/**
 * IUI Step 1: Gây rụng trứng (Ovulation Induction)
 */
export interface IUIStimulationData {
  // Thuốc và liều
  medications: Array<{
    drugName: string;
    dosage: string;
    unit: string; // mg, IU, ml
    startDate: string;
    endDate?: string;
    route: string; // oral, injection, etc.
    notes?: string;
  }>;

  // Kết quả siêu âm
  ultrasoundResults: Array<{
    date: string;
    day: number; // Day of cycle (D2, D3, etc.)
    follicles: {
      right: number; // Số nang buồng trứng phải
      left: number; // Số nang buồng trứng trái
      dominantSize?: number; // Kích thước nang ưu thế (mm)
      dominantCount?: number; // Số nang ưu thế
    };
    endometriumThickness: number; // Độ dày niêm mạc (mm)
    endometriumPattern?: string; // trilaminar, homogeneous, etc.
    notes?: string;
  }>;

  // Trigger shot (hCG injection)
  triggerShot?: {
    date: string;
    time: string;
    medication: string; // Ovidrel, Pregnyl, etc.
    dosage: string;
  };
}

/**
 * IUI Step 2: Chuẩn bị tinh trùng (Sperm Preparation)
 */
export interface IUISpermPreparationData {
  collectionDate: string;
  collectionTime: string;

  // Đánh giá trước lọc (Raw semen analysis)
  beforeProcessing: {
    volume: number; // ml
    concentration: number; // million/ml
    totalCount: number; // million
    progressiveMotility: number; // PR%
    totalMotility: number; // %
    viability: number; // %
    normalMorphology: number; // %
    pH?: number;
    liquefactionTime?: number; // minutes
    appearance?: string; // normal, abnormal
    viscosity?: string; // normal, high, low
  };

  // Phương pháp xử lý
  processingMethod: string; // Swim-up, Density gradient, etc.
  processingTime?: string;

  // Đánh giá sau lọc (Post-processing)
  afterProcessing: {
    volume: number; // ml
    concentration: number; // million/ml
    totalCount: number; // million
    progressiveMotility: number; // PR%
    totalMotility: number; // %
    viability: number; // %
    normalMorphology: number; // %
  };

  notes?: string;
}

/**
 * IUI Step 3: Bơm IUI (IUI Procedure)
 */
export interface IUIInseminationData {
  procedureDate: string;
  procedureTime: string;
  hoursAfterTrigger: number; // 34-36h typically

  // Người thực hiện
  performedBy: {
    doctorId: string;
    doctorName: string;
  };

  // Chi tiết thủ thuật
  catheterType: string; // Type of catheter used
  catheterSize?: string;
  difficulty?: "Easy" | "Moderate" | "Difficult";

  // Vị trí đặt tinh trùng
  placementLocation: "Intrauterine" | "Intracervical";
  placementDepth?: string; // cm from external os

  // Sự cố
  complications?: Array<{
    type: string; // Bleeding, pain, catheter difficulty, etc.
    severity: "Minor" | "Moderate" | "Severe";
    management: string;
  }>;

  patientTolerance?: "Good" | "Fair" | "Poor";
  bedRestDuration?: number; // minutes
  notes?: string;
}

/**
 * IUI Step 4: Hỗ trợ hoàng thể (Luteal Phase Support)
 */
export interface IUILutealSupportData {
  medications: Array<{
    drugName: string; // Progesterone, Estrogen, etc.
    dosage: string;
    unit: string;
    route: string; // oral, vaginal, IM
    startDate: string;
    frequency: string; // once daily, twice daily, etc.
    duration?: string; // days or until pregnancy test
  }>;

  followUpSchedule?: Array<{
    date: string;
    purpose: string; // Blood test, ultrasound, etc.
  }>;

  notes?: string;
}

/**
 * IUI Step 5: Test thai (Pregnancy Test)
 */
export interface IUIPregnancyTestData {
  // β-hCG Test
  testDate: string;
  daysPostIUI: number; // Typically 14 days
  betaHCG: number; // mIU/ml
  result: "Positive" | "Negative" | "Biochemical";

  // Repeat test nếu positive
  repeatTests?: Array<{
    date: string;
    daysPostIUI: number;
    betaHCG: number;
  }>;

  // Siêu âm xác nhận (nếu positive)
  ultrasoundConfirmation?: {
    date: string;
    gestationalSac: boolean;
    yolkSac: boolean;
    fetalPole: boolean;
    heartbeat: boolean;
    numberOfSacs?: number;
  };

  // Thông báo bệnh nhân
  patientNotified: boolean;
  notificationDate?: string;
  notificationMethod?: string; // phone, in-person, etc.

  outcome:
    | "Clinical pregnancy"
    | "Biochemical pregnancy"
    | "Negative"
    | "Ongoing";
  notes?: string;
}

/**
 * Complete IUI Workflow Data
 */
export interface IUIWorkflowData {
  cycleId: string;
  patientId: string;
  treatmentId: string;
  startDate: string;

  timeline: {
    day2to3Tests?: string; // D2-3 xét nghiệm
    day9to12Ultrasound?: string; // D9-12 siêu âm
    triggerInjection?: string; // Tiêm hCG
    iuiProcedure?: string; // 34-36h thực hiện IUI
    pregnancyTest?: string; // +14 ngày xét nghiệm β-hCG
  };

  stimulation?: IUIStimulationData;
  spermPreparation?: IUISpermPreparationData;
  insemination?: IUIInseminationData;
  lutealSupport?: IUILutealSupportData;
  pregnancyTest?: IUIPregnancyTestData;

  currentStatus: CycleStatus;
  completionDate?: string;
  finalOutcome?: string;
  notes?: string;
}

// ============================================================================
// IVF Workflow Types
// ============================================================================

/**
 * IVF Step 1: Kích thích buồng trứng (Controlled Ovarian Stimulation)
 */
export interface IVFStimulationData {
  // Protocol
  protocol: "Long" | "Short" | "Antagonist" | "Mini" | "Natural" | "Other";
  protocolDetails?: string;
  startDate: string;

  // Thuốc kích thích
  medications: Array<{
    drugName: string; // FSH, hMG, etc.
    dosage: string;
    unit: string;
    startDate: string;
    endDate?: string;
    adjustments?: Array<{
      date: string;
      newDosage: string;
      reason: string;
    }>;
  }>;

  // Monitoring (USG và E2)
  monitoring: Array<{
    date: string;
    day: number; // Stimulation day

    // Ultrasound
    follicles: {
      small: number; // <10mm
      medium: number; // 10-14mm
      large: number; // 14-17mm
      mature: number; // >17mm
      totalCount: number;
      largestSize?: number;
    };
    endometriumThickness: number; // mm

    // Estradiol (E2)
    e2Level?: number; // pg/ml or pmol/L

    // LH level (if measured)
    lhLevel?: number;

    notes?: string;
  }>;

  // Trigger shot
  triggerShot: {
    date: string;
    time: string;
    medication: string; // hCG, GnRH agonist, dual trigger
    dosage: string;
  };

  // Antagonist (if used)
  antagonist?: {
    startDate: string;
    medication: string;
    dosage: string;
  };
}

/**
 * IVF Step 2: Chọc hút trứng (Oocyte Pickup - OPU)
 */
export interface IVFOocytePickupData {
  procedureDate: string;
  procedureTime: string;
  hoursAfterTrigger: number; // Typically 35-36h

  // Người thực hiện
  performedBy: {
    doctorId: string;
    doctorName: string;
    embryologistId?: string;
    embryologistName?: string;
  };

  // Gây mê
  anesthesia: {
    type: "IV sedation" | "General" | "Local" | "None";
    medications?: string;
    duration?: number; // minutes
  };

  // Kết quả chọc hút
  totalOocytesRetrieved: number;

  // Phân loại noãn theo độ trưởng thành
  oocyteClassification: {
    mii: number; // Metaphase II (mature)
    mi: number; // Metaphase I (immature)
    gv: number; // Germinal Vesicle (immature)
    atretic: number; // Degenerated
  };

  // Hình thái noãn
  oocyteMorphology?: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };

  // Chi tiết từng bên buồng trứng
  ovaries: {
    right: {
      folliclesAspirated: number;
      oocytesRetrieved: number;
    };
    left: {
      folliclesAspirated: number;
      oocytesRetrieved: number;
    };
  };

  // Sự cố
  complications?: Array<{
    type: string; // Bleeding, pain, difficulty, etc.
    severity: "Minor" | "Moderate" | "Severe";
    management: string;
  }>;

  recoveryTime?: number; // minutes
  notes?: string;
}

/**
 * IVF Step 3: Chuẩn bị tinh trùng (Sperm Preparation for IVF)
 */
export interface IVFSpermPreparationData {
  sampleType: "Fresh" | "Frozen" | "TESA" | "PESA" | "Donor";
  collectionDate: string;
  collectionTime?: string;

  // Nếu frozen
  freezeDate?: string;
  thawDate?: string;
  thawTime?: string;

  // Raw analysis
  rawAnalysis: {
    volume?: number; // ml
    concentration: number; // million/ml
    totalCount?: number; // million
    progressiveMotility: number; // PR%
    totalMotility?: number; // %
    viability: number; // %
    normalMorphology: number; // %
  };

  // Sau xử lý
  processingMethod: string;
  postProcessing: {
    concentration: number;
    progressiveMotility: number;
    viability: number;
    normalMorphology: number;
  };

  // Recommendation
  recommendedMethod: "IVF" | "ICSI" | "Mixed";
  notes?: string;
}

/**
 * IVF Step 4: Thụ tinh (Fertilization)
 */
export interface IVFFertilizationData {
  fertilizationDate: string;
  fertilizationTime: string;

  // Phương pháp
  method: "IVF" | "ICSI" | "Mixed";

  // Số noãn được thụ tinh
  oocytesInseminated: {
    ivf?: number;
    icsi?: number;
    total: number;
  };

  // Kiểm tra thụ tinh (sau 16-18h)
  fertilizationCheck: {
    checkDate: string;
    checkTime: string;

    // 2PN (normal fertilization)
    twoPN: number;

    // Abnormal fertilization
    onePN?: number;
    threePN?: number;
    zeroPN?: number; // Failed fertilization
  };

  fertilizationRate: number; // %
  notes?: string;
}

/**
 * IVF Step 5: Nuôi phôi (Embryo Culture)
 */
export interface IVFEmbryoCultureData {
  cultureStartDate: string;
  cultureSystem: string; // Sequential, single-step, etc.
  cultureConditions?: string; // 5% O2, 6% CO2, etc.

  // Theo dõi từng ngày
  dailyAssessment: Array<{
    day: number; // Day 1, 2, 3, 5, 6
    date: string;
    assessmentTime: string;

    embryos: Array<{
      embryoId: string;
      cellCount?: number; // Day 2-3
      fragmentation: number; // %
      grade?: string; // A, B, C, D hoặc 1-4

      // Blastocyst (Day 5-6)
      blastocystGrade?: {
        expansion: number; // 1-6
        icm: "A" | "B" | "C"; // Inner Cell Mass
        te: "A" | "B" | "C"; // Trophectoderm
        fullGrade?: string; // e.g., "4AA", "5AB"
      };

      developmentStatus:
        | "Developing"
        | "Arrested"
        | "Degenerated"
        | "Transferred"
        | "Frozen";
      notes?: string;
    }>;
  }>;

  // Tóm tắt
  summary: {
    totalEmbryos: number;
    goodQuality: number;
    fairQuality: number;
    poorQuality: number;
    arrested: number;
  };

  notes?: string;
}

/**
 * IVF Step 6: Chuyển phôi (Embryo Transfer)
 */
export interface IVFEmbryoTransferData {
  transferDate: string;
  transferTime: string;
  transferType: "Fresh" | "Frozen" | "Blastocyst" | "Cleavage";
  dayOfTransfer: number; // Day 3, Day 5, etc.

  // Người thực hiện
  performedBy: {
    doctorId: string;
    doctorName: string;
    embryologistId?: string;
    embryologistName?: string;
    witnessId?: string;
    witnessName?: string;
  };

  // Embryo(s) transferred
  embryosTransferred: Array<{
    embryoId: string;
    embryoCode: string;
    quality: string; // Grade
    cellCount?: number;
    blastocystGrade?: string;
    freezeDate?: string; // If FET
    thawDate?: string; // If FET
    survived?: boolean; // If FET
  }>;

  numberOfEmbryosTransferred: number;

  // Embryos frozen
  embryosCryopreserved?: Array<{
    embryoId: string;
    embryoCode: string;
    quality: string;
    dayOfFreeze: number;
    freezeDate: string;
    storageLocation?: string;
  }>;

  numberOfEmbryosFrozen?: number;

  // Transfer details
  catheterType: string;
  catheterSize?: string;
  difficulty: "Easy" | "Moderate" | "Difficult";
  ultrasoundGuidance: boolean;
  endometriumThickness: number; // mm at transfer

  // Mock transfer done?
  mockTransferDone?: boolean;
  mockTransferDate?: string;

  complications?: Array<{
    type: string;
    severity: "Minor" | "Moderate" | "Severe";
    management: string;
  }>;

  bedRestDuration?: number; // minutes
  notes?: string;
}

/**
 * IVF Step 7: Hỗ trợ hoàng thể (Luteal Phase Support)
 */
export interface IVFLutealSupportData {
  startDate: string;

  medications: Array<{
    drugName: string;
    dosage: string;
    unit: string;
    route: string;
    frequency: string;
    duration: string;
  }>;

  followUpSchedule?: Array<{
    date: string;
    purpose: string;
  }>;

  notes?: string;
}

/**
 * IVF Step 8: Test thai (Pregnancy Test)
 */
export interface IVFPregnancyTestData {
  // β-hCG Test
  firstTestDate: string;
  daysPostTransfer: number; // Typically 10-14 days
  betaHCG: number; // mIU/ml
  result: "Positive" | "Negative" | "Biochemical";

  // Repeat tests
  repeatTests?: Array<{
    date: string;
    daysPostTransfer: number;
    betaHCG: number;
    doublingTime?: number; // hours
  }>;

  // Siêu âm xác nhận
  ultrasoundConfirmation?: Array<{
    date: string;
    weeksGestation?: number;
    findings: {
      gestationalSac?: number; // Number of sacs
      yolkSac?: number;
      fetalPole?: number;
      heartbeat?: number;
      crownRumpLength?: number; // mm
    };
    notes?: string;
  }>;

  // Outcome
  outcome:
    | "Clinical pregnancy - singleton"
    | "Clinical pregnancy - twins"
    | "Clinical pregnancy - triplets+"
    | "Biochemical pregnancy"
    | "Ectopic pregnancy"
    | "Miscarriage"
    | "Negative"
    | "Ongoing";

  patientNotified: boolean;
  notificationDate?: string;
  notificationMethod?: string;

  notes?: string;
}

/**
 * Complete IVF Workflow Data
 */
export interface IVFWorkflowData {
  cycleId: string;
  patientId: string;
  treatmentId: string;
  startDate: string;

  stimulation?: IVFStimulationData;
  oocytePickup?: IVFOocytePickupData;
  spermPreparation?: IVFSpermPreparationData;
  fertilization?: IVFFertilizationData;
  embryoCulture?: IVFEmbryoCultureData;
  embryoTransfer?: IVFEmbryoTransferData;
  lutealSupport?: IVFLutealSupportData;
  pregnancyTest?: IVFPregnancyTestData;

  currentStatus: CycleStatus;
  completionDate?: string;
  finalOutcome?: string;
  notes?: string;
}

// ============================================================================
// Combined Workflow Data
// ============================================================================

export type TreatmentWorkflowData = IUIWorkflowData | IVFWorkflowData;

export interface WorkflowStepStatus {
  stepId: string;
  stepName: string;
  completed: boolean;
  completedDate?: string;
  completedBy?: string;
}
