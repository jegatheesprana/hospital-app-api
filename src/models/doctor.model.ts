import { Schema, model, Model, Document, ObjectId, Types } from 'mongoose';

interface ISlot extends Document {
    time: string,
    isBooked: boolean
}

type SlotModelType = Model<ISlot>;

const slotSchema = new Schema<ISlot, SlotModelType>({
    time : {
        type: String,
    },
    isBooked : {
        type: Boolean,
        default: false
    }
})

interface IDateSchedule extends Document {
    date: string,
    slots: Types.DocumentArray<ISlot>
}

type DateScheduleModelType = Model<IDateSchedule>;

const dateSchedule = new Schema<IDateSchedule, DateScheduleModelType>({
    date : {
        type: String
    },
    slots : [slotSchema]
})

interface IDoctor extends Document {
    email: string,
    password: string,
    name: string,
    phoneNumber: string,
    specialization: string,
    feesPerSession: string,
    dates: Types.DocumentArray<IDateSchedule>
}

type DoctorModelType = Model<IDoctor>;

const doctorSchema = new Schema<IDoctor, DoctorModelType>({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    specialization: {
        type: String
    },
    feesPerSession: {
        type: String
    },
    dates : [dateSchedule]
});

const Doctor = model<IDoctor, DoctorModelType>('Doctor', doctorSchema);
const Slot = model<ISlot, SlotModelType>('Slot', slotSchema);
const DateSchedule = model<IDateSchedule, DateScheduleModelType>('DateSchedule', dateSchedule);

export {
    Doctor,
    Slot,
    DateSchedule
};