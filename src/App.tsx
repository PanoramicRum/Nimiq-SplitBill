import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BillSplitFlow } from './pages/BillSplitFlow';
import { useBillStore } from './store/useBillStore';
import { StepStart } from './steps/StepStart';
import { StepScanBill } from './steps/StepScanBill';
import { StepOcrProcessing } from './steps/StepOcrProcessing';
import { StepBillReview } from './steps/StepBillReview';
import { StepManualAmount } from './steps/StepManualAmount';
import { StepTip } from './steps/StepTip';
import { StepPeople } from './steps/StepPeople';
import { StepSplitMethod } from './steps/StepSplitMethod';
import { StepAssignItems } from './steps/StepAssignItems';
import { StepEvenSplit } from './steps/StepEvenSplit';
import { StepPercentageSplit } from './steps/StepPercentageSplit';
import { StepResults } from './steps/StepResults';

export default function App() {
  const isDarkMode = useBillStore((s) => s.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BillSplitFlow />}>
          <Route index element={<StepStart />} />
          <Route path="scan" element={<StepScanBill />} />
          <Route path="scan/processing" element={<StepOcrProcessing />} />
          <Route path="scan/review" element={<StepBillReview />} />
          <Route path="manual" element={<StepManualAmount />} />
          <Route path="manual/items" element={<StepBillReview />} />
          <Route path="tip" element={<StepTip />} />
          <Route path="people" element={<StepPeople />} />
          <Route path="split-method" element={<StepSplitMethod />} />
          <Route path="split/items" element={<StepAssignItems />} />
          <Route path="split/even" element={<StepEvenSplit />} />
          <Route path="split/percentage" element={<StepPercentageSplit />} />
          <Route path="results" element={<StepResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
