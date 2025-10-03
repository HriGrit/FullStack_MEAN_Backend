import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/  // YYYY-MM-DD format
    },
    slot: {
      type: Number,
      required: true,
      min: 0,
      max: 7
    },
    status: {
      type: String,
      enum: ['BOOKED', 'CANCELLED'],
      default: 'BOOKED',
      required: true,
      index: true
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Note: No unique index on (doctorId, date, slot). Best-effort checks are done at app level.

// Additional indexes for queries
appointmentSchema.index({ patientId: 1, date: 1 });

export const AppointmentModel = mongoose.model('Appointment', appointmentSchema);


