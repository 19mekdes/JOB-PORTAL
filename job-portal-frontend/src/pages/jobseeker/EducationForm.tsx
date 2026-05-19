// src/pages/jobseeker/EducationForm.tsx
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Save, GraduationCap } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface Education {
  id: string
  institution: string
  degree: string
  field_of_study: string
  start_date: string
  end_date: string
  current: boolean
  description: string
}

interface EducationFormProps {
  education: Education[]
  onUpdate: (education: Education[]) => void
}

const EducationForm: React.FC<EducationFormProps> = ({ education, onUpdate }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Education>({
    id: '',
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    current: false,
    description: ''
  })

  const resetForm = () => {
    setFormData({
      id: '',
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      current: false,
      description: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!formData.institution || !formData.degree) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Please fill in institution and degree" 
      })
      return
    }

    setSaving(true)
    
    let updatedEducation: Education[]
    if (editingId) {
      updatedEducation = education.map(item => 
        item.id === editingId ? { ...formData, id: editingId } : item
      )
    } else {
      updatedEducation = [...education, { ...formData, id: Date.now().toString() }]
    }
    
    onUpdate(updatedEducation)
    
    try {
      await api.put('/auth/profile', { education: updatedEducation })
      toast({ 
        title: "Success", 
        description: editingId ? "Education updated successfully" : "Education added successfully" 
      })
      resetForm()
    } catch (error) {
      console.error('Error saving education:', error)
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to save education" 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const updatedEducation = education.filter(item => item.id !== id)
    onUpdate(updatedEducation)
    try {
      await api.put('/auth/profile', { education: updatedEducation })
      toast({ title: "Success", description: "Education deleted successfully" })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete education" })
    }
  }

  const handleEdit = (item: Education) => {
    setFormData(item)
    setEditingId(item.id)
    setShowForm(true)
  }

  return (
    <Card className="border border-gray-200 shadow-sm rounded-xl">
      <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Education</CardTitle>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Education
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">{editingId ? 'Edit Education' : 'Add New Education'}</h3>
            <div className="space-y-3">
              <div>
                <Label>Institution *</Label>
                <Input 
                  value={formData.institution} 
                  onChange={(e) => setFormData({...formData, institution: e.target.value})} 
                  placeholder="University name"
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label>Degree *</Label>
                <Input 
                  value={formData.degree} 
                  onChange={(e) => setFormData({...formData, degree: e.target.value})} 
                  placeholder="Bachelor's Degree, Master's, PhD"
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label>Field of Study</Label>
                <Input 
                  value={formData.field_of_study} 
                  onChange={(e) => setFormData({...formData, field_of_study: e.target.value})} 
                  placeholder="Computer Science, Business, etc."
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
                <Label>I currently study here</Label>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Additional details about your education..."
                  rows={2}
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

        {/* Education List */}
        {education.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No education added yet</p>
            <p className="text-sm mt-1">Click "Add Education" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {education.map((item) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.degree}</h4>
                    <p className="text-sm text-gray-600">{item.institution}</p>
                    {item.field_of_study && <p className="text-xs text-gray-500">{item.field_of_study}</p>}
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

export default EducationForm