import { Router } from "express";

import patientsRouter from './patients';
import doctorsRotuer from './doctors';
import appointmentRouter from './appointments';
import adminRouter from './admin'
import meeting from './meeting'

const router: Router = Router();

router.use('/doctors', doctorsRotuer);
router.use('/patients', patientsRouter);
router.use('/appointments', appointmentRouter);
router.use('/admin', adminRouter);
router.use('/meeting', meeting);

export default router