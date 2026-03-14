import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ScreenShell } from '../components/layout/ScreenShell';
import { ProgressStepper } from '../components/layout/ProgressStepper';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

function getStepFromPath(pathname: string): number {
  if (
    pathname === '/' ||
    pathname.startsWith('/scan') ||
    pathname === '/manual'
  )
    return 1;
  if (pathname === '/tip') return 2;
  if (pathname === '/people') return 3;
  if (pathname === '/split-method' || pathname.startsWith('/split/')) return 4;
  if (pathname === '/results') return 5;
  return 1;
}

export function BillSplitFlow() {
  const location = useLocation();
  const currentStep = getStepFromPath(location.pathname);
  const showStepper = location.pathname !== '/';

  return (
    <ScreenShell>
      {showStepper && <ProgressStepper currentStep={currentStep} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </ScreenShell>
  );
}
