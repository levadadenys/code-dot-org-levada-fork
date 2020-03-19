# Write a flat list of workshop attendance by session for the enrollment
class Api::V1::Pd::EnrollmentFlatAttendanceSerializer < ActiveModel::Serializer
  attributes :first_name, :last_name, :email, :district_name, :school, :role, :grades_teaching

  def district_name
    object.try(:school_info).try(:school_district).try(:name)
  end

  def school
    object.try(:school_info).try {|si| si.school.try(:name) || si.school_name} || object.school
  end

  # Add dynamic attributes for each session's date and attendance
  def attributes(attrs = {})
    super(attrs).tap do |data|
      object.workshop.sessions.each_with_index do |session, i|
        data["session_#{i + 1}_date".to_sym] = session.formatted_date
        data["session_#{i + 1}_attendance".to_sym] = session.attendances.where(pd_enrollment_id: object.id).exists?
      end
      data[:cdo_scholarship] = object.scholarship_status == Pd::ScholarshipInfoConstants::YES_CDO ? 'Yes' : ''
      data[:other_scholarship] = object.scholarship_status == Pd::ScholarshipInfoConstants::YES_OTHER ? 'Yes' : ''
    end
  end
end
