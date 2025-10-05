import { Department } from "../models/departmentModel.js";
import { User } from "../models/userModel.js";
import mongoose from 'mongoose';

export const getAllDepartments = async (req, res) => {
    try {
        const depts = await Department.find({}).select('_id name').lean();
        const data = depts.map(d => ({ dept_id: d._id, name: d.name }));
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
    }
};



export const getAllPatients = async (req, res) => {
    try {
        const patients = await User.find({ role: 'PATIENT' })
            .select('_id name email phone role')
            .lean();

        const data = patients.map(p => ({
            patient_id: p._id,
            name: p.name || '',
            email: p.email || '',
            phone: p.phone || ''
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, error: { code: 'FETCH_PATIENTS_FAILED', message: 'Something went wrong' } });
    }
};

export const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_ID', message: 'Invalid patient id' }
            });
        }

        const patient = await User.findById(id)
            .select('_id name email phone role createdAt updatedAt')
            .lean();

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: { code: 'PATIENT_NOT_FOUND', message: 'Patient not found' }
            });
        }

        if (patient.role !== 'PATIENT') {
            return res.status(400).json({
                success: false,
                error: { code: 'NOT_A_PATIENT', message: 'User is not a patient' }
            });
        }

        const data = {
            patient_id: patient._id,
            name: patient.name || '',
            email: patient.email || '',
            phone: patient.phone || '',
            role: patient.role,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt
        };

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: { code: 'FETCH_PATIENT_FAILED', message: 'Something went wrong' }
        });
    }
};
