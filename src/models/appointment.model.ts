import { Schema, model, Document } from 'mongoose';

interface IFeedback extends Document  {
    given: boolean,
    stars: number,
    title: string,
    review: string
}

const feedback = new Schema<IFeedback>({
    given : {
        type : Boolean,
        default : false
    },
    stars : {
        type : Number,
        default : 0,
        min : 0,
        max : 5
    },
    title : {
        type : String,
        default : ""
    },
    review : {
        type : String,
        default : ""
    }
})

interface IAppointment extends Document {
    doctorId: string,
    dateId: string,
    slotId: string,
    patientId: string,
    date: string,
    slotTime: string,
    doctorName: string,
    doctorEmail: string,
    patientName: string,
    googleMeetLink: string,
    meetingId: string,
    feedback: IFeedback
}

const appointmentSchema = new Schema<IAppointment>({
    doctorId : {
        required: true,
        type: String
    },
    dateId : {
        required: true,
        type: String
    },
    slotId : {
        required: true,
        type: String
    },
    patientId : {
        required: true,
        type: String
    },
    date : {
        type: String
    },
    slotTime : {
        type: String
    },
    doctorName : {
        type : String
    },
    doctorEmail : {
        type : String
    },
    patientName : {
        type : String
    },
    googleMeetLink : {
        type : String
    },
    meetingId: {
        type: String
    },
    feedback : feedback
});

const Appointment = model<IAppointment>('Appointment', appointmentSchema);
const Feedback = model<IFeedback>('Feedback', feedback);

export { Appointment,  Feedback };