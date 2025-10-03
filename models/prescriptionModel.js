import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true
    },
    doctorNotes: {
      type: String
    },
    medicines: {
      type: String
    }
  },
  { timestamps: true }
);

export const PrescriptionModel = mongoose.model('Prescription', prescriptionSchema);


