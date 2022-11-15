import {Router, Request, Response} from 'express'
import Patient from '../models/patient.model';
import { Appointment } from '../models/appointment.model'
import jwt, { Secret, JwtPayload, SignOptions, DecodeOptions } from 'jsonwebtoken'
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { hash, compare, genSalt } from 'bcrypt';

const stripe = new Stripe("sk_test_51IabQNSCj4BydkZ38AsoDragCM19yaMzGyBVng5KUZnCNrxCJuj308HmdAvoRcUEe2PEdoORMosOaRz1Wl8UX0Gt00FCuSwYpz", {
    // @ts-ignore
    apiVersion: null,
  })

const router: Router = Router();

router.route('/').get((req: Request, res: Response) => {
    Patient.find().then(patients => {
        res.status(200).json(patients);
    }).catch((err) => {
        res.status(400).json(`Error : ${err}`);
    })
})



// To update a patient's phone number
router.route('/update-phone').put((req: Request, res: Response) => {
    const patientId = req.body.patientId;

    Patient.findOne({ _id: patientId }).then(patient => {
        if (patient) {
            patient.phoneNumber = req.body.phoneNumber;

            patient.save().then(() => {
                res.status(200).json('Patient\'s phone number updated');
            }).catch(err => {
                res.status(400).json({ message: `Error : ${err}` });
            });
        }
    })
})

interface CustomPayload extends JwtPayload {
    email: string,
    name: string,
    picture: string,
    sub: string
}

router.route('/signup').post(async (req: Request, res: Response)=> {
    const username = req.body.username; // Required.. can't be undefined
	const password = req.body.password;
	const name = req.body.name;
	const phoneNumber = req.body.phoneNumber;

    // Hash password
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

	const newPatient = new Patient({
		username,
		password: hashedPassword,
		name,
		phoneNumber,
	});

	newPatient
		.save()
		.then(() => {
			res.json("Patient added");
			// console.log(`${newDoctor} added!`)
		})
		.catch((err) => {
			res.status(400).json(`Error : ${err}`);
			// console.log(err);
		});
})

router.route("/login").post(async (req: Request, res: Response) => {
	try {
		const username = req.body.username;
		const plainTextPassword = req.body.password;

		const patient = await Patient.findOne({
			username: username,
		});

        console.log(patient)

		if (patient === null || !(await compare(plainTextPassword, patient.password))) {
			return res.status(201).json({ message: "wrong username or password" });
		}

		// Doctor found, return the token to the client side
		const token = jwt.sign(
			JSON.stringify(patient),
			process.env.KEY as Secret, 
			{
				algorithm: process.env.ALGORITHM as string,
			} as SignOptions
		);

		return res.status(200).json({ token: token.toString(), user: {...patient?.toJSON(), type: 'patient'} });

	} catch (err) {
		console.log(err);
		return res.status(400).json(err);
	}
});

router.route('/getPatientDetails/:patientId').get(async (req: Request, res: Response) => {
    try {
        const patientId = req.params.patientId;
        const patient = await Patient.findOne({ _id: patientId });

        if (patient) {
            return res.status(200).json(patient);
        }
        else {
            return res.status(201).json({ message: "Patient not found!" });
        }
    }
    catch (err) {
        console.log(err);
        res.status(400).json({ message: err });
    }
})

router.route('/previous-appointments').post(async (req: Request, res: Response) => {
    try {
        const patientId = req.body.patientId;
        const appointments = await Appointment.find({ patientId: patientId });

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
            return Date.parse(currDateTime) >= (Date.parse(appointment.date + 'T' + appointment.slotTime)+30*600000)
        })

        const sortedAppointments = filteredAppointments.sort((a, b) => {
            return Date.parse(b.date + 'T' + b.slotTime) - Date.parse(a.date + 'T' + a.slotTime)
        })

        res.status(200).json(sortedAppointments);
    }
    catch (err) {
        console.log(err)
        res.status(400).json(err)
    }
})

router.route('/upcoming-appointments').post(async (req: Request, res: Response) => {
    try {
        const patientId = req.body.patientId;
        const appointments = await Appointment.find({ patientId: patientId });

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
            return Date.parse(currDateTime) <= (Date.parse(appointment.date + 'T' + appointment.slotTime)+30*60000)
        })

        const sortedAppointments = filteredAppointments.sort((a, b) => {
            return Date.parse(a.date + 'T' + a.slotTime) - Date.parse(b.date + 'T' + b.slotTime)
        })

        res.status(200).json(sortedAppointments);
    }
    catch (err) {
        console.log(err)
        res.status(400).json(err)
    }
})

router.route("/payment").post(async (req: Request, res: Response) => {
    const { finalBalnce, token } = req.body;
    // console.log(product);
    const idempotencyKey = uuidv4();

    return stripe.customers
        .create({
            email: token.email,
            source: token.id
        })
        .then(customer => {
            stripe.charges
                .create(
                    {
                        amount: finalBalnce * 100,
                        currency: 'usd',
                        customer: customer.id,
                        receipt_email: token.email,
                        description: `Booked Appointement Successfully`,
                        shipping: {
                            name: token.card.name,
                            address: {
                                line1: token.card.address_line1,
                                line2: token.card.address_line2,
                                city: token.card.address_city,
                                country: token.card.address_country,
                                postal_code: token.card.address_zip
                            }
                        }
                    },
                    {
                        idempotencyKey
                    }
                )
                .then(result => res.status(200).json(result))
                .catch(err => {
                    console.log(`Error : ${err}`);
                    res.status(400).json(err);
                });
        })
        .catch((err) => {
            console.log(err);
            res.status(400).json(err);
        });
})


export default router;