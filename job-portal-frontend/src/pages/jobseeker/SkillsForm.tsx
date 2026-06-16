import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Plus, X, Save, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import api from '@/services/api'

interface SkillsFormProps {
  onUpdate?: () => void
  initialSkills?: string[]
}

const SkillsForm: React.FC<SkillsFormProps> = ({ onUpdate, initialSkills = [] }) => {
  const [skills, setSkills] = useState<string[]>(initialSkills)
  const [newSkill, setNewSkill] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [suggestedSkills] = useState<string[]>([
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 
    'HTML/CSS', 'SQL', 'MongoDB', 'Express.js', 'Next.js', 'Tailwind CSS',
    'GraphQL', 'Docker', 'Git', 'AWS', 'Figma', 'UI/UX Design'
  ])

  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      const response = await api.get('/profile/me')
      const userSkills = response.data.data.profile?.skills || []
      setSkills(userSkills)
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add new skill
  const addSkill = async () => {
    if (!newSkill.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a skill" })
      return
    }
    
    if (skills.includes(newSkill.trim())) {
      toast({ variant: "destructive", title: "Error", description: "Skill already exists" })
      return
    }

    const updatedSkills = [...skills, newSkill.trim()]
    setSkills(updatedSkills)
    setNewSkill('')
    
    try {
      await api.put('/auth/profile', { skills: updatedSkills })
      toast({ title: "Success", description: "Skill added successfully" })
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding skill:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to add skill" })
    }
  }

  // Remove skill
  const removeSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove)
    setSkills(updatedSkills)
    
    try {
      await api.put('/auth/profile', { skills: updatedSkills })
      toast({ title: "Success", description: "Skill removed" })
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error removing skill:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to remove skill" })
    }
  }

  // Add suggested skill
  const addSuggestedSkill = async (skill: string) => {
    if (skills.includes(skill)) {
      toast({ variant: "destructive", title: "Error", description: "Skill already exists" })
      return
    }

    const updatedSkills = [...skills, skill]
    setSkills(updatedSkills)
    
    try {
      await api.put('/auth/profile', { skills: updatedSkills })
      toast({ title: "Success", description: `${skill} added` })
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error adding skill:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to add skill" })
    }
  }

  // Save all skills
  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/auth/profile', { skills })
      toast({ title: "Success", description: "Skills saved successfully" })
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error saving skills:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to save skills" })
    } finally {
      setSaving(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  if (loading) {
    return (
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading your skills...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-linear-to-r from-blue-50 to-white">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Skills & Expertise
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">Add your technical and professional skills</p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Add New Skill Section */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-semibold">Add New Skill</Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., JavaScript, React, Python, Project Management"
                className="pr-24 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button 
                onClick={addSkill}
                size="sm"
                className="absolute right-1 top-1 h-8 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400">Press Enter or click Add to add a skill</p>
        </div>

        {/* Your Skills Section */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-semibold">Your Skills ({skills.length})</Label>
          <div className="min-h-30 p-4 bg-gray-50 rounded-lg border border-gray-100">
            {skills.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400">No skills added yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your first skill above</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full px-4 py-2 text-sm font-medium transition-colors group"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-500 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Suggested Skills Section */}
        <div className="space-y-3">
          <Label className="text-gray-700 font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Suggested Skills
          </Label>
          <div className="flex flex-wrap gap-2">
            {suggestedSkills
              .filter(skill => !skills.includes(skill))
              .slice(0, 12)
              .map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors rounded-full px-3 py-1 text-sm"
                  onClick={() => addSuggestedSkill(skill)}
                >
                  + {skill}
                </Badge>
              ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-100">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving Skills...' : 'Save All Skills'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SkillsForm