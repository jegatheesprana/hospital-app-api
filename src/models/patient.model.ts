import { Schema, model, Document } from 'mongoose';

interface IPatient extends Document {
    googleId: string,
    email: string,
    name: string,
    picture: string,
    phoneNumber: string
}

const patientSchema = new Schema<IPatient>({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email : {
        type: String
    },
    name: {
        type: String
    },
    picture: {
        type: String
    },
    phoneNumber: {
        type: String
    }
});

const Patient = model<IPatient>('Patient', patientSchema);

export default Patient;