import { Router, Request, Response } from "express";
import { Doctor, Slot, DateSchedule } from "../models/doctor.model";
import jwt, { Secret, JwtPayload, SignOptions } from 'jsonwebtoken'
import { Appointment, Feedback } from "../models/appointment.model";
import { hash, compare, genSalt } from "bcrypt";

const router: Router = Router();

function createDate(date: string) {
	return new DateSchedule({
		date: date,
		slots: [
			new Slot({
				time: "09:00:00",
				isBooked: false,
			}),
			new Slot({
				time: "12:00:00",
				isBooked: false,
			}),
			new Slot({
				time: "15:00:00",
				isBooked: false,
			}),
		],
	});
}

// To get all the doctors
// **ONLY FOR TESTING**
router.route("/").get((req: Request, res: Response) => {
	Doctor.find()
		.then((doctors) => {
			res.json(doctors);
		})
		.catch((err) => {
			res.status(400).json(`Error : ${err}`);
		});
});

// To add a doctor
router.route("/add").post(async (req: Request, res: Response) => {
	const email = req.body.email; // Required.. can't be undefined
	const password = req.body.password;
	const name = req.body.name;
	const phoneNumber = req.body.phoneNumber;
	const specialization = req.body.specialization;
	const feesPerSession = req.body.feesPerSession;

	// Hash password
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

	const newDoctor = new Doctor({
		email,
		password: hashedPassword,
		name,
		phoneNumber,
		specialization,
		feesPerSession,
	});

	newDoctor
		.save()
		.then(() => {
			res.json("Doctor added");
			// console.log(`${newDoctor} added!`)
		})
		.catch((err) => {
			res.status(400).json(`Error : ${err}`);
			// console.log(err);
		});
});

// To update a doctor
router.route("/update").put((req: Request, res: Response) => {
	const username = req.body.username; // Required.. can't be undefined

	Doctor.findOne({ username: username }).then((doctor) => {
		if (doctor) {
			doctor.name = req.body.name;
			doctor.phoneNumber = req.body.phoneNumber;
			doctor.specialization = req.body.specialization;
			doctor.feesPerSession = req.body.feesPerSession;

			doctor
				.save()
				.then(() => {
					res.json("Doctor updated");
					// console.log(`${doctor} updated!`)
				})
				.catch((err) => {
					res.status(400).json(`Error : ${err}`);
					// console.log(err);
				});
		}
	});
});

// Doctor login
router.route("/login").post(async (req: Request, res: Response) => {
	try {
		const username = req.body.username;
		const plainTextPassword = req.body.password;

		const doctor = await Doctor.findOne({
			username: username,
		});

		if (!doctor || !(await compare(plainTextPassword, doctor.password))) {
			return res.status(201).json({ message: "wrong username or password" });
		}

		// Doctor found, return the token to the client side
		const token = jwt.sign(
			JSON.stringify(doctor),
			process.env.KEY as Secret, 
			{
				algorithm: process.env.ALGORITHM as string,
			} as SignOptions
		);

		return res.status(200).json({ token: token.toString(), user: {...doctor.toJSON(), type: 'doctor'} });

	} catch (err) {
		console.log(err);
		return res.status(400).json(err);
	}
});

// To get the slots available for the date
router.route("/get-slots").post(async (req: Request, res: Response) => {
	try {
		const id = req.body.doctorId; // Doctor's id
		const date = req.body.date; // Date to book

		const doctor = await Doctor.findOne({ _id: id });

		// Doctor not found
		if (doctor === null) {
			console.log("Doctor not found in the database!");
			return res.status(201).json({
				message: "Doctor not found in the database!",
			});
		}

		// Doctor found
		// Find the date
		let count = 0;
		for (const i of doctor.dates) {
			if (i.date === date) {
				return res.status(200).json(i);
			}
			count++;
		}

		const oldLength = count;

		// Add new slots if date not found in the db
		const dateSchedule = createDate(date);
		const updatedDoctor = await Doctor.findOneAndUpdate(
			{ _id: doctor._id },
			{ $push: { dates: dateSchedule } },
			{ new: true }
		);

		if (updatedDoctor) {
			return res.status(200).json(updatedDoctor.dates[oldLength]);
		} else {
			const err = { err: "an error occurred!" };
			throw err;
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({
			message: err,
		});
	}
});

router.route("/book-slot").post((req: Request, res: Response) => {
	const patientId = req.body.patientId; // Patient's google id
	const patientName = req.body.patientName; // Patient's name
	const doctorId = req.body.doctorId; // Doctor's id 606460d2e0dd28cc76d9b0f3 
	const slotId = req.body.slotId; // Id of that particular slot
	const dateId = req.body.dateId; // Id of that particular date
	const meetLink = "";

	Doctor.findOne({ _id: doctorId }).then((doctor) => {
		if (!doctor) return res.status(400).json({error: 'Cannot find doctor'});
		const date = doctor.dates.id(dateId);
		const slot = date?.slots.id(slotId);
		if (!date || !slot) return res.status(400).json({error: 'No slot found'});
		slot.isBooked = true;
		doctor
			.save()
			.then(() => {
				// Create an entry in the appointment database
				const newAppointment = new Appointment({
					doctorId,
					dateId,
					slotId,
					patientId,
					date: date.date,
					slotTime: slot.time,
					doctorName: doctor.name,
					doctorEmail: doctor.email,
					patientName: patientName,
					googleMeetLink: meetLink,
					feedback: new Feedback()
				});

				console.log(newAppointment);

				newAppointment
					.save()
					.then((appointment) => {
						return res.status(200).json(appointment);
					})
					.catch((err) => {
						console.log(err);
						res.status(400).json(err);
					});
			})
			.catch((err) => {
				console.log(err);
				res.status(400).json({
					message: `An error occurred : ${err}`,
				});
			});
	});
});

router.route("/appointments").post(async (req: Request, res: Response) => {
	try {
		const doctorId = req.body.doctorId;
		const appointments = await Appointment.find({
			doctorId: doctorId,
		});
		// res.status(200).json(appointments);
		const sortedAppointments = appointments.sort((a, b) => {
			return (
				Date.parse(b.date + "T" + b.slotTime) -
				Date.parse(a.date + "T" + a.slotTime)
			);
		});

		res.status(200).json(sortedAppointments);
	} catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
});

router.route("/appointment/:id").get(async (req: Request, res: Response) => {
	try {
		const appointmentId = req.params.id;
		const appointment = await Appointment.findOne({
			_id: appointmentId,
		});

		res.status(200).json(appointment);
	} catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
});

router.route('/todays-appointments').post(async (req: Request, res: Response) => {
	try {
		const date = new Date()
		let currDate = date.getFullYear().toString()
		const month = date.getMonth() + 1
		const day = date.getDate()

		currDate += month < 10 ? ('-0' + month.toString()) : '-' + month.toString()
		currDate += day < 10 ? ('-0' + day.toString()) : '-' + day.toString()

		const doctorId = req.body.doctorId;

		const appointments = await Appointment.find({ doctorId: doctorId, date: currDate });

		const sortedAppointments = appointments.sort((a, b) => {
			return (
				Date.parse(a.date + "T" + a.slotTime) - Date.parse(b.date + "T" + b.slotTime)
			);
		});

		res.status(200).json(sortedAppointments);
	}
	catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
})

router.route('/all-appointments').post(async (req: Request, res: Response) => {
	try {

		const doctorId = req.body.doctorId;

		const appointments = await Appointment.find({ doctorId: doctorId });

		const sortedAppointments = appointments.sort((a, b) => {
			return (
				Date.parse(a.date + "T" + a.slotTime) - Date.parse(b.date + "T" + b.slotTime)
			);
		});

		res.status(200).json(sortedAppointments);
	}
	catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
})

router.route('/previous-appointments').post(async (req: Request, res: Response) => {
	try {
		const doctorId = req.body.doctorId;

		const appointments = await Appointment.find({ doctorId: doctorId });

		// Get current dateTime
		const date = new Date()
		let currDateTime = date.getFullYear().toString()
		const month = date.getMonth() + 1
		const day = date.getDate()
		const hour = date.getHours()
		const minutes = date.getMinutes()
		const seconds = date.getSeconds()

		currDateTime += month < 10 ? ('-0' + month.toString()) : '-' + month.toString()
		currDateTime += day < 10 ? ('-0' + day.toString()) : '-' + day.toString()
		currDateTime += hour < 10 ? ('T0' + hour.toString()) : 'T' + hour.toString()
		currDateTime += minutes < 10 ? (':0' + minutes.toString()) : ':' + minutes.toString()
		currDateTime += seconds < 10 ? (':0' + seconds.toString()) : ':' + seconds.toString()

		const filteredAppointments = appointments.filter((appointment) => {
			return Date.parse(currDateTime) >= Date.parse(appointment.date + 'T' + appointment.slotTime)
		})

		const sortedAppointments = filteredAppointments.sort((a, b) => {
			return Date.parse(b.date + 'T' + b.slotTime) - Date.parse(a.date + 'T' + a.slotTime)
		})

		res.status(200).json(sortedAppointments);
	}
	catch (err) {
		console.log(err);
		res.status(400).json(err);
	}
})

export default router;
