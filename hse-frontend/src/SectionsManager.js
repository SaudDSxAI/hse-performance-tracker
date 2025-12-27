// SectionsManager.js
// Add this as a new component file in your src folder

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import * as api from './api';

export default function SectionsManager({ project, onUpdate }) {
  const [sections, setSections] = useState([]);
  const [hiddenSections, setHiddenSections] = useState(new Set());
  const [modal, setModal] = useState(null); // 'addSection', 'editSection', 'assignCandidate'
  const [form, setForm] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch sections when component mounts
  useEffect(() => {
    if (project?.id) {
      fetchSections();
    }
  }, [project?.id]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await api.getSectionsByProject(project.id);
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
      alert('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createSection(form, project.id);
      await fetchSections();
      setModal(null);
      setForm({});
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating section:', error);
      alert('Failed to create section');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateSection(selectedSection.id, form);
      await fetchSections();
      setModal(null);
      setForm({});
      setSelectedSection(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Failed to update section');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? All candidate assignments will be removed.')) return;
    
    try {
      setLoading(true);
      await api.deleteSection(sectionId);
      await fetchSections();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCandidate = async (sectionId, candidateId) => {
    try {
      setLoading(true);
      await api.assignCandidateToSection(candidateId, sectionId);
      await fetchSections();
      setModal(null);
      setSelectedSection(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error assigning candidate:', error);
      alert('Failed to assign candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignCandidate = async (sectionId, candidateId) => {
    if (!window.confirm('Remove this candidate from the section?')) return;
    
    try {
      setLoading(true);
      await api.unassignCandidateFromSection(candidateId, sectionId);
      await fetchSections();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error unassigning candidate:', error);
      alert('Failed to remove candidate');
    } finally {
      setLoading(false);
    }
  };

  const toggleSectionVisibility = (sectionId) => {
    setHiddenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getSectionCandidates = (sectionId) => {
    // Get candidates assigned to this section
    const section = sections.find(s => s.id === sectionId);
    if (!section) return [];
    
    // Filter project candidates by section assignment
    return (project.candidates || []).filter(candidate => {
      // You'll need to add section_ids to candidate data
      return candidate.section_ids?.includes(sectionId);
    });
  };

  const getUnassignedCandidates = (sectionId) => {
    return (project.candidates || []).filter(candidate => {
      return !candidate.section_ids?.includes(sectionId);
    });
  };

  if (loading && sections.length === 0) {
    return <div className="p-8 text-center text-gray-500">Loading sections...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sections</h2>
          <p className="text-sm text-gray-500">Organize candidates into sections</p>
        </div>
        <button
          onClick={() => { setForm({}); setModal('addSection'); }}
          className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
        >
          <Plus size={18} />
          Add Section
        </button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No sections yet</h3>
          <p className="text-gray-500 mb-4">Create sections to organize your candidates</p>
          <button
            onClick={() => { setForm({}); setModal('addSection'); }}
            className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-800"
          >
            Create Your First Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map(section => {
            const isHidden = hiddenSections.has(section.id);
            const sectionCandidates = getSectionCandidates(section.id);
            
            return (
              <div key={section.id} className="border rounded-lg bg-white shadow-sm">
                {/* Section Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleSectionVisibility(section.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {isHidden ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{section.name}</h3>
                      {section.description && (
                        <p className="text-sm text-gray-500">{section.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {sectionCandidates.length} candidate{sectionCandidates.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSectionVisibility(section.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                      title={isHidden ? 'Show section' : 'Hide section'}
                    >
                      {isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => {
                        setForm({ name: section.name, description: section.description });
                        setSelectedSection(section);
                        setModal('editSection');
                      }}
                      className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Section Content (Collapsible) */}
                {!isHidden && (
                  <div className="p-4">
                    {sectionCandidates.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Users size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No candidates in this section</p>
                        <button
                          onClick={() => {
                            setSelectedSection(section);
                            setModal('assignCandidate');
                          }}
                          className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          + Assign Candidates
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                          {sectionCandidates.map(candidate => (
                            <div
                              key={candidate.id}
                              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <img
                                src={candidate.photo}
                                alt={candidate.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{candidate.name}</p>
                                {candidate.role && (
                                  <p className="text-xs text-gray-500 truncate">{candidate.role}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleUnassignCandidate(section.id, candidate.id)}
                                className="p-1 hover:bg-red-50 rounded text-red-500"
                                title="Remove from section"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSection(section);
                            setModal('assignCandidate');
                          }}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          + Assign More Candidates
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Section Modal */}
      {(modal === 'addSection' || modal === 'editSection') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {modal === 'addSection' ? 'Add Section' : 'Edit Section'}
              </h3>
              <button onClick={() => { setModal(null); setForm({}); setSelectedSection(null); }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={modal === 'addSection' ? handleAddSection : handleEditSection}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Section Name *</label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., Civil Works, MEP, Safety Team"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows="3"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => { setModal(null); setForm({}); setSelectedSection(null); }}
                  className="flex-1 border rounded-lg px-4 py-2 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 text-white rounded-lg px-4 py-2 hover:bg-emerald-800 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (modal === 'addSection' ? 'Create' : 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Candidate Modal */}
      {modal === 'assignCandidate' && selectedSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Assign Candidates to "{selectedSection.name}"
              </h3>
              <button onClick={() => { setModal(null); setSelectedSection(null); }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              {getUnassignedCandidates(selectedSection.id).length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  All candidates are already assigned to this section
                </p>
              ) : (
                getUnassignedCandidates(selectedSection.id).map(candidate => (
                  <div
                    key={candidate.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <img
                      src={candidate.photo}
                      alt={candidate.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{candidate.name}</p>
                      {candidate.role && <p className="text-sm text-gray-500">{candidate.role}</p>}
                    </div>
                    <button
                      onClick={() => handleAssignCandidate(selectedSection.id, candidate.id)}
                      className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 text-sm"
                      disabled={loading}
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => { setModal(null); setSelectedSection(null); }}
                className="w-full border rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}