# == Schema Information
#
# Table name: programming_environments
#
#  id         :bigint           not null, primary key
#  name       :string(255)      not null
#  properties :text(65535)
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class ProgrammingEnvironment < ApplicationRecord
  has_many :programming_expressions

  def self.properties_from_file(path, content)
    environment_config = JSON.parse(content)
    {
      name: environment_config['name']
    }
  end

  def self.seed_all(blob="config/programming_environments/*.json")
    removed_records = all.pluck(:name)
    Dir.glob(Rails.root.join(blob)).each do |path|
      removed_records -= [ProgrammingEnvironment.seed_record(path)]
    end
    where(name: removed_records).destroy_all
  end

  def self.seed_record(file_path)
    properties = properties_from_file(file_path, File.read(file_path))
    environment = ProgrammingEnvironment.find_or_initialize_by(name: properties[:name])
    environment.update! properties
    environment.name
  end
end
