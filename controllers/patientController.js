import { Department } from "../models/departmentModel.js";

export const getAllDepartments = async (req, res) => {
    try {
        const depts = await Department.find({}).select('_id name').lean();
        const data = depts.map(d => ({ dept_id: d._id, name: d.name }));
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
    }
};


