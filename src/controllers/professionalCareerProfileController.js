const asyncHandler = require('express-async-handler');
const { 
  ProfessionalCareerProfile, 
  WorkExperience, 
  HigherEducation, 
  BasicEducation, 
  ProfessionalMembership, 
  TrainingCertification, 
  ReferenceDetail,
  User
} = require('../models');
const { createError } = require('../utils/errorUtils');
const fileUploadService = require('../services/fileUploadService');

// Get professional career profile
const getProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const profile = await ProfessionalCareerProfile.findOne({
    where: { userId },
    include: [
      { 
        model: WorkExperience, 
        as: 'workExperiences',
        attributes: { exclude: ['profileId'] }
      },
      { 
        model: HigherEducation, 
        as: 'higherEducations',
        attributes: { exclude: ['profileId'] }
      },
      { 
        model: BasicEducation, 
        as: 'basicEducations',
        attributes: { exclude: ['profileId'] }
      },
      { 
        model: ProfessionalMembership, 
        as: 'professionalMemberships',
        attributes: { exclude: ['profileId'] }
      },
      { 
        model: TrainingCertification, 
        as: 'trainingCertifications',
        attributes: { exclude: ['profileId'] }
      },
      { 
        model: ReferenceDetail, 
        as: 'referenceDetails',
        attributes: { exclude: ['profileId'] }
      }
    ]
  });

  if (!profile) {
    return res.status(200).json({
      success: true,
      data: { profile: null },
      message: 'No professional career profile found'
    });
  }

  // Ensure profilePicture is a full URL
  let profileData = profile.toJSON();
  if (profileData.profilePicture && profileData.profilePicture.startsWith('/api/uploads')) {
    profileData.profilePicture = `${req.protocol}://${req.get('host')}${profileData.profilePicture}`;
  }

  res.status(200).json({
    success: true,
    data: { profile: profileData }
  });
});

// Create or update professional career profile
const createOrUpdateProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  // Parse form data - handle both JSON strings and direct values
  const parseArrayField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch (e) {
      return [];
    }
  };

  const parseObjectArrayField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch (e) {
      return [];
    }
  };

  const NYSC_ENUM_VALUES = ['Yes', 'No', 'Ongoing', 'Exempted'];
  const GENDER_ENUM_VALUES = ['male', 'female', 'other'];

  const sanitizeString = (value) => {
    if (typeof value !== 'string' || value.trim() === '' || value === 'null') return null;
    return value.trim();
  };

  const sanitizeEnum = (value, allowed) => {
    if (!value || value === '' || value === 'null' || value === null) return null;
    return allowed.includes(value) ? value : null;
  };

  const sanitizeArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(v => v && v !== '');
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr.filter(v => v && v !== '') : [];
    } catch {
      return [];
    }
  };

  const sanitizeNumber = (value) => {
    if (value === undefined || value === null || value === '' || isNaN(Number(value))) return null;
    return Number(value);
  };

  const sanitizeDate = (value) => {
    if (!value || value === '' || value === 'Invalid date') return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); // yyyy-mm-dd
  };

  const {
    profilePicture,
    fullName,
    gender,
    dateOfBirth,
    phoneNumber,
    emailAddress: rawEmailAddress,
    address,
    lgaOfResidence,
    stateOfResidence,
    professionalSummary,
    persona,
    expertiseCompetencies: rawExpertiseCompetencies,
    softwareSkills: rawSoftwareSkills,
    nyscStatus,
    workExperiences: rawWorkExperiences,
    higherEducations: rawHigherEducations,
    basicEducations: rawBasicEducations,
    professionalMemberships: rawProfessionalMemberships,
    trainingCertifications: rawTrainingCertifications,
    referenceDetails: rawReferenceDetails
  } = req.body;

  console.log('Received email address:', rawEmailAddress);
  console.log('Email address type:', typeof rawEmailAddress);

  // Sanitize all fields
  const safeProfilePicture = sanitizeString(profilePicture);
  const safeFullName = sanitizeString(fullName);
  const safeGender = sanitizeEnum(gender, GENDER_ENUM_VALUES);
  const safeDateOfBirth = sanitizeDate(dateOfBirth);
  const safePhoneNumber = sanitizeString(phoneNumber);
  let emailAddress = rawEmailAddress;
  if (emailAddress && emailAddress.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return next(createError(400, 'Please provide a valid email address'));
    }
  } else {
    emailAddress = null;
  }
  const safeAddress = sanitizeString(address);
  const safeLgaOfResidence = sanitizeString(lgaOfResidence);
  const safeStateOfResidence = sanitizeString(stateOfResidence);
  const safeProfessionalSummary = sanitizeString(professionalSummary);
  const safePersona = sanitizeString(persona);
  const expertiseCompetencies = sanitizeArray(rawExpertiseCompetencies);
  const softwareSkills = sanitizeArray(rawSoftwareSkills);
  const safeNyscStatus = sanitizeEnum(nyscStatus, NYSC_ENUM_VALUES);

  // Sanitize workExperiences dates and strings
  const safeWorkExperiences = (parseObjectArrayField(rawWorkExperiences) || []).map(exp => ({
    ...exp,
    companyName: sanitizeString(exp.companyName),
    companyLocation: sanitizeString(exp.companyLocation),
    designation: sanitizeString(exp.designation),
    entryDate: sanitizeDate(exp.entryDate),
    exitDate: sanitizeDate(exp.exitDate),
    jobDescription: sanitizeString(exp.jobDescription),
    achievements: sanitizeString(exp.achievements)
  }));

  // Sanitize higherEducations dates and strings
  const safeHigherEducations = (parseObjectArrayField(rawHigherEducations) || []).map(edu => ({
    ...edu,
    institutionName: sanitizeString(edu.institutionName),
    location: sanitizeString(edu.location),
    courseOfStudy: sanitizeString(edu.courseOfStudy),
    qualification: sanitizeString(edu.qualification),
    entryYear: sanitizeNumber(edu.yearOfEntry || edu.entryYear),
    graduationYear: sanitizeNumber(edu.yearOfGraduation || edu.graduationYear)
  }));

  // Sanitize basicEducations
  const safeBasicEducations = (parseObjectArrayField(rawBasicEducations) || []).map(edu => ({
    ...edu,
    schoolName: sanitizeString(edu.schoolName),
    educationType: sanitizeString(edu.educationType),
    certification: sanitizeString(edu.certification),
    year: sanitizeNumber(edu.year)
  }));

  // Sanitize professionalMemberships
  const safeProfessionalMemberships = (parseObjectArrayField(rawProfessionalMemberships) || []).map(mem => ({
    ...mem,
    professionalBodyName: sanitizeString(mem.professionalBodyName),
    yearOfJoining: sanitizeNumber(mem.yearOfJoining)
  }));

  // Sanitize trainingCertifications
  const safeTrainingCertifications = (parseObjectArrayField(rawTrainingCertifications) || []).map(cert => ({
    ...cert,
    trainingOrganization: sanitizeString(cert.trainingOrganization),
    certificationName: sanitizeString(cert.certificationName),
    dateOfCertification: sanitizeDate(cert.dateOfCertification)
  }));

  // Sanitize referenceDetails
  const safeReferenceDetails = (parseObjectArrayField(rawReferenceDetails) || []).map(ref => ({
    ...ref,
    refereeName: sanitizeString(ref.refereeName),
    occupation: sanitizeString(ref.occupation),
    location: sanitizeString(ref.location),
    contactNumber: sanitizeString(ref.contactNumber),
    emailAddress: sanitizeString(ref.emailAddress)
  }));

  // Validate required fields
  if (!fullName) {
    return next(createError(400, 'Full name is required'));
  }

  // Handle profile picture upload if provided
  let profilePictureUrl = profilePicture;
  if (req.file) {
    try {
      const uploadResult = await fileUploadService.uploadFile(req.file, 'professional-profiles', req);
      profilePictureUrl = uploadResult.url;
    } catch (error) {
      console.error('File upload error:', error);
      return next(createError(400, 'Failed to upload profile picture'));
    }
  }

  // Handle related data with transaction
  const transaction = await ProfessionalCareerProfile.sequelize.transaction();

  try {
    // Find existing profile or create new one
    let profile = await ProfessionalCareerProfile.findOne({ 
      where: { userId },
      paranoid: false // Explicitly disable soft deletes for this query
    });
    
    if (profile) {
      // Update existing profile
      await profile.update({
        profilePicture: safeProfilePicture,
        fullName: safeFullName,
        gender: safeGender,
        dateOfBirth: safeDateOfBirth,
        phoneNumber: safePhoneNumber,
        emailAddress,
        address: safeAddress,
        lgaOfResidence: safeLgaOfResidence,
        stateOfResidence: safeStateOfResidence,
        professionalSummary: safeProfessionalSummary,
        persona: safePersona,
        expertiseCompetencies: expertiseCompetencies,
        softwareSkills: softwareSkills,
        nyscStatus: safeNyscStatus
      }, { transaction });
    } else {
      // Create new profile
      profile = await ProfessionalCareerProfile.create({
        userId,
        profilePicture: safeProfilePicture,
        fullName: safeFullName,
        gender: safeGender,
        dateOfBirth: safeDateOfBirth,
        phoneNumber: safePhoneNumber,
        emailAddress,
        address: safeAddress,
        lgaOfResidence: safeLgaOfResidence,
        stateOfResidence: safeStateOfResidence,
        professionalSummary: safeProfessionalSummary,
        persona: safePersona,
        expertiseCompetencies: expertiseCompetencies,
        softwareSkills: softwareSkills,
        nyscStatus: safeNyscStatus
      }, { transaction });
    }
    // Handle work experiences
    if (safeWorkExperiences && Array.isArray(safeWorkExperiences)) {
      // Delete existing work experiences
      await WorkExperience.destroy({ 
        where: { profileId: profile.id },
        transaction 
      });

      // Create new work experiences
      for (const experience of safeWorkExperiences) {
        if (experience.companyName && experience.designation && experience.entryDate) {
          await WorkExperience.create({
            profileId: profile.id,
            ...experience
          }, { 
            transaction,
            returning: false
          });
        }
      }
    }

    // Handle higher education
    if (safeHigherEducations && Array.isArray(safeHigherEducations)) {
      await HigherEducation.destroy({ 
        where: { profileId: profile.id },
        transaction 
      });

      for (const education of safeHigherEducations) {
        if (education.institutionName && education.courseOfStudy && education.qualification && education.entryYear) {
          await HigherEducation.create({
            profileId: profile.id,
            ...education
          }, { 
            transaction,
            returning: false
          });
        }
      }
    }

    // Handle basic education
    if (safeBasicEducations && Array.isArray(safeBasicEducations)) {
      await BasicEducation.destroy({ 
        where: { profileId: profile.id },
        transaction 
      });

      for (const edu of safeBasicEducations) {
        if (edu.schoolName) {
          await BasicEducation.create({
            profileId: profile.id,
            ...edu
          }, { 
            transaction,
            returning: false
          });
        }
      }
    }

    // Handle professional memberships
    if (safeProfessionalMemberships && Array.isArray(safeProfessionalMemberships)) {
      await ProfessionalMembership.destroy({ 
        where: { profileId: profile.id },
        transaction 
      });

      for (const mem of safeProfessionalMemberships) {
        if (mem.professionalBodyName) {
          await ProfessionalMembership.create({
            profileId: profile.id,
            ...mem
          }, { 
            transaction,
            returning: false
          });
        }
      }
    }

    // Handle training certifications
    if (safeTrainingCertifications && Array.isArray(safeTrainingCertifications)) {
      await TrainingCertification.destroy({ 
        where: { profileId: profile.id },
        transaction 
      });

      for (const cert of safeTrainingCertifications) {
        if (cert.trainingOrganization && cert.certificationName) {
          await TrainingCertification.create({
            profileId: profile.id,
            ...cert
          }, { 
            transaction,
            returning: false
          });
        }
      }
    }

    // Handle reference details
    if (safeReferenceDetails && Array.isArray(safeReferenceDetails)) {
      await ReferenceDetail.destroy({ 
        where: { profileId: profile.id },
        transaction 
      });

      for (const ref of safeReferenceDetails) {
        if (ref.refereeName) {
          await ReferenceDetail.create({
            profileId: profile.id,
            ...ref
          }, { 
            transaction,
            returning: false
          });
        }
      }
    }

    // Update User model's careerProfilePicture field if profile picture was uploaded
    if (profilePictureUrl && profilePictureUrl !== profilePicture) {
      await User.update(
        { careerProfilePicture: profilePictureUrl },
        { 
          where: { id: userId },
          transaction 
        }
      );
    }

    await transaction.commit();

    // Fetch updated profile with all related data
    const updatedProfile = await ProfessionalCareerProfile.findOne({
      where: { id: profile.id },
      include: [
        { model: WorkExperience, as: 'workExperiences' },
        { model: HigherEducation, as: 'higherEducations' },
        { model: BasicEducation, as: 'basicEducations' },
        { model: ProfessionalMembership, as: 'professionalMemberships' },
        { model: TrainingCertification, as: 'trainingCertifications' },
        { model: ReferenceDetail, as: 'referenceDetails' }
      ]
    });

    res.status(200).json({
      success: true,
      data: { profile: updatedProfile },
      message: profile.id ? 'Profile updated successfully' : 'Profile created successfully'
    });

  } catch (error) {
    // Only rollback if transaction hasn't been committed yet
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Profile save error:', error);
    console.error('Error stack:', error.stack);
    return next(createError(500, 'Failed to save profile data'));
  }
});

// Delete professional career profile
const deleteProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const profile = await ProfessionalCareerProfile.findOne({ where: { userId } });

  if (!profile) {
    return next(createError(404, 'Professional career profile not found'));
  }

  await profile.destroy();

  res.status(200).json({
    success: true,
    message: 'Professional career profile deleted successfully'
  });
});

module.exports = {
  getProfile,
  createOrUpdateProfile,
  deleteProfile
}; 