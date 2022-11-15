import { Router, Request, Response } from "express";
import { Appointment, Feedback } from "../models/appointment.model";

const router: Router = Router();

router.route('/add-meet-link').put((req: Request, res: Response) => {
    const meetLink = req.body.meetLink;
    const appointmentId = req.body.appointmentId;
    const meetingId = req.body.meetingId;

    Appointment.findOne({ _id: appointmentId }).then((appointment) => {
        if (appointment) {
            appointment.googleMeetLink = meetLink;
            appointment.meetingId = meetingId;
            console.log(`Received meet link : ${meetLink}`);

            appointment.save().then(() => {
                console.log(`Updated the meet link!`);
                res.status(200).json({ message: "Meet link updated!" });
            }).catch((err) => {
                console.log(`Cannot add meet link to the appointment due to ${err}`);
                res.status(400).json({ message: `Cannot add meet link to the appointment due to ${err}` });
            })
        }
    })
})

router.route('/feedback').put((req: Request, res: Response) => {
    const appointmentId = req.body.appointmentId;
    const stars = req.body.stars;
    const title = req.body.title;
    const review = req.body.review;

    Appointment.findOne({ _id : appointmentId }).then((appointment) => {
        if(appointment) {
            appointment.feedback.stars = stars;
            appointment.feedback.title = title;
            appointment.feedback.review = review;
            appointment.feedback.given = true;

            appointment.save().then(() => {
                res.status(200).json({message : `Feedback updated successfully!`});
            }).catch(err => {
                console.log(err);
                res.status(400).json(err);
            })
        }
    }).catch(err => {
        console.log(err);
        res.status(400).json(err);
    })
})

export default router;