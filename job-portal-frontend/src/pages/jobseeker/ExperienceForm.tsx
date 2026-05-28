import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Save, Briefcase } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Experience {
  id: string
  title: string
  company: string
  location: string
  start_date: string
  end_date: string
  current: boolean
  description: string
}

interface ExperienceFormProps {
  experience: Experience[]
  onUpdate: (experience: Experience[]) => void
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({ experience, onUpdate }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Experience>({
    id: '',
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    current: false,
    description: ''
  })

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.company) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Please fill in job title and company" 
      })
      return
    }

    setSaving(true)
    
    let updatedExperience: Experience[]
    if (editingId) {
      updatedExperience = experience.map(item => 
        item.id === editingId ? { ...formData, id: editingId } : item
      )
    } else {
      updatedExperience = [...experience, { ...formData, id: Date.now().toString() }]
    }
    
    onUpdate(updatedExperience)
    
    try {
      await api.put('/auth/profile', { experience: updatedExperience })
      toast({ 
        title: "Success", 
        description: editingId ? "Experience updated successfully" : "Experience added successfully" 
      })
      resetForm()
    } catch (error) {
      console.error('Error saving experience:', error)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to save experience" 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const updatedExperience = experience.filter(item => item.id !== id)
    onUpdate(updatedExperience)
    try {
      await api.put('/auth/profile', { experience: updatedExperience })
      toast({ title: "Success", description: "Experience deleted successfully" })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete experience" })
    }
  }

  const handleEdit = (item: Experience) => {
    setFormData(item)
    setEditingId(item.id)
    setShowForm(true)
  }

  return (
    <Card className="border border-gray-200 shadow-sm rounded-xl">
      <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Work Experience</CardTitle>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Experience
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">{editingId ? 'Edit Experience' : 'Add New Experience'}</h3>
            <div className="space-y-3">
              <div>
                <Label>Job Title *</Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g., Senior Software Engineer"
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label>Company *</Label>
                <Input 
                  value={formData.company} 
                  onChange={(e) => setFormData({...formData, company: e.target.value})} 
                  placeholder="Company name"
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                  placeholder="City, Country or Remote"
                  className="mt-1 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input 
                    type="month" 
                    value={formData.start_date} 
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input 
                    type="month" 
                    value={formData.end_date} 
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                    disabled={formData.current}
                    className="mt-1 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.current} 
                  onCheckedChange={(checked) => setFormData({...formData, current: checked, end_date: checked ? '' : formData.end_date})} 
                />
                <Label>I currently work here</Label>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Describe your responsibilities and achievements..."
                  rows={3}
                  className="mt-1 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={saving} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={resetForm} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Experience List */}
        {experience.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No work experience added yet</p>
            <p className="text-sm mt-1">Click "Add Experience" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {experience.map((item) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.company}</p>
                    {item.location && <p className="text-xs text-gray-500">{item.location}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {item.start_date} - {item.current ? 'Present' : item.end_date}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ExperienceForm