import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { toast } from './toast'

/**
 * Export utilities for PDF and Excel
 */

// PDF Export Functions

/**
 * Export prescription to PDF
 */
export const exportPrescriptionToPDF = (prescription: any, doctorInfo: any, patientInfo: any) => {
    try {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.text('Medical Prescription', 105, 20, { align: 'center' })

        // Doctor Info
        doc.setFontSize(12)
        doc.text(`Doctor: ${doctorInfo.fullName}`, 20, 40)
        doc.text(`Specialty: ${doctorInfo.specialty}`, 20, 47)
        doc.text(`License: ${doctorInfo.licenseNumber || 'N/A'}`, 20, 54)

        // Patient Info
        doc.text(`Patient: ${patientInfo.fullName}`, 20, 68)
        doc.text(`Date: ${new Date(prescription.date).toLocaleDateString()}`, 20, 75)

        // Diagnosis
        doc.text('Diagnosis:', 20, 89)
        doc.setFontSize(10)
        doc.text(prescription.diagnosis, 20, 96, { maxWidth: 170 })

        // Medications Table
        doc.setFontSize(12)
        doc.text('Prescribed Medications:', 20, 110)

        autoTable(doc, {
            startY: 115,
            head: [['Medication', 'Dosage', 'Frequency', 'Duration']],
            body: prescription.medications.map((med: any) => [med.name, med.dosage, med.frequency, med.duration]),
            theme: 'grid',
            headStyles: { fillColor: [66, 139, 202] },
        })

        // Notes
        if (prescription.notes) {
            const finalY = (doc as any).lastAutoTable.finalY || 150
            doc.setFontSize(12)
            doc.text('Additional Notes:', 20, finalY + 15)
            doc.setFontSize(10)
            doc.text(prescription.notes, 20, finalY + 22, { maxWidth: 170 })
        }

        // Signature
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(10)
        doc.text('_____________________', 20, pageHeight - 30)
        doc.text("Doctor's Signature", 20, pageHeight - 23)

        doc.text('Status: ' + prescription.status.toUpperCase(), 150, pageHeight - 30)

        // Save PDF
        doc.save(`prescription_${prescription.id}_${Date.now()}.pdf`)
        toast.success('PDF exported successfully')
    } catch (error) {
        console.error('PDF export error:', error)
        toast.error('Failed to export PDF')
    }
}

/**
 * Export report to PDF
 */
export const exportReportToPDF = (reportData: any, title: string) => {
    try {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.text(title, 105, 20, { align: 'center' })

        // Date
        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

        // Statistics
        doc.setFontSize(14)
        doc.text('Summary Statistics', 20, 45)

        const stats = [
            ['Total Patients', reportData.totalPatients || '0'],
            ['Total Appointments', reportData.totalAppointments || '0'],
            ['Completed Treatments', reportData.completedTreatments || '0'],
            ['Pending Prescriptions', reportData.pendingPrescriptions || '0'],
        ]

        autoTable(doc, {
            startY: 50,
            body: stats,
            theme: 'plain',
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80 },
                1: { cellWidth: 50 },
            },
        })

        // Additional Details
        if (reportData.details) {
            const finalY = (doc as any).lastAutoTable.finalY || 100
            doc.setFontSize(14)
            doc.text('Detailed Breakdown', 20, finalY + 15)

            autoTable(doc, {
                startY: finalY + 20,
                head: [Object.keys(reportData.details[0])],
                body: reportData.details.map((item: any) => Object.values(item)),
                theme: 'grid',
                headStyles: { fillColor: [66, 139, 202] },
            })
        }

        doc.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
        toast.success('Report exported successfully')
    } catch (error) {
        console.error('PDF export error:', error)
        toast.error('Failed to export report')
    }
}

// Excel Export Functions

/**
 * Export appointments to Excel
 */
export const exportAppointmentsToExcel = (appointments: any[]) => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(
            appointments.map(apt => ({
                Date: apt.date,
                'Start Time': apt.startTime,
                'End Time': apt.endTime,
                Title: apt.title,
                Type: apt.type,
                Location: apt.location,
                Status: apt.status,
            })),
        )

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments')

        XLSX.writeFile(workbook, `appointments_${Date.now()}.xlsx`)
        toast.success('Appointments exported successfully')
    } catch (error) {
        console.error('Excel export error:', error)
        toast.error('Failed to export appointments')
    }
}

/**
 * Export patients to Excel
 */
export const exportPatientsToExcel = (patients: any[]) => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(
            patients.map(patient => ({
                'Full Name': patient.fullName,
                Email: patient.email,
                Phone: patient.phone,
                'Date of Birth': patient.dateOfBirth,
                Gender: patient.gender,
                Status: patient.status,
            })),
        )

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients')

        XLSX.writeFile(workbook, `patients_${Date.now()}.xlsx`)
        toast.success('Patients exported successfully')
    } catch (error) {
        console.error('Excel export error:', error)
        toast.error('Failed to export patients')
    }
}

/**
 * Export lab samples to Excel
 */
export const exportLabSamplesToExcel = (samples: any[]) => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(
            samples.map(sample => ({
                'Sample ID': sample.id,
                Type: sample.type,
                'Collection Date': sample.collectionDate,
                Quality: sample.quality,
                Status: sample.status,
                'Storage Location': sample.storageLocation,
                Notes: sample.notes,
            })),
        )

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Lab Samples')

        XLSX.writeFile(workbook, `lab_samples_${Date.now()}.xlsx`)
        toast.success('Lab samples exported successfully')
    } catch (error) {
        console.error('Excel export error:', error)
        toast.error('Failed to export lab samples')
    }
}

/**
 * Export prescriptions to Excel
 */
export const exportPrescriptionsToExcel = (prescriptions: any[]) => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(
            prescriptions.map(rx => ({
                'Prescription ID': rx.id,
                'Patient ID': rx.patientId,
                Date: rx.date,
                Diagnosis: rx.diagnosis,
                Medications: rx.medications.map((m: any) => m.name).join(', '),
                Status: rx.status,
            })),
        )

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Prescriptions')

        XLSX.writeFile(workbook, `prescriptions_${Date.now()}.xlsx`)
        toast.success('Prescriptions exported successfully')
    } catch (error) {
        console.error('Excel export error:', error)
        toast.error('Failed to export prescriptions')
    }
}

/**
 * Export treatments to Excel
 */
export const exportTreatmentsToExcel = (treatments: any[]) => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(
            treatments.map(treatment => ({
                'Treatment ID': treatment.id,
                Type: treatment.type,
                Diagnosis: treatment.diagnosis,
                'Start Date': treatment.startDate,
                'End Date': treatment.endDate || 'Ongoing',
                Status: treatment.status,
            })),
        )

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Treatments')

        XLSX.writeFile(workbook, `treatments_${Date.now()}.xlsx`)
        toast.success('Treatments exported successfully')
    } catch (error) {
        console.error('Excel export error:', error)
        toast.error('Failed to export treatments')
    }
}
