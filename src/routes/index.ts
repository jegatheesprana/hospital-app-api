import { Router } from "express";

import patientsRouter from './patients';
import doctorsRotuer from './doctors';
import appointmentRouter from './appointments';

const router = Router();

router.use('/doctors', doctorsRotuer);
router.use('/patients', patientsRouter);

export default router