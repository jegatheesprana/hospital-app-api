import { Schema, model, Document } from 'mongoose';

interface IPatient extends Document {
    username: string,
    name: string,
    phoneNumber: string,
    password: string
}

const patientSchema = new Schema<IPatient>({
    username: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    password: {
        type: String
    }
});

const Patient = model<IPatient>('Patient', patientSchema);

export default Patient;