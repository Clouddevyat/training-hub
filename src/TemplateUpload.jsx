import React, { useState } from 'react';
import { Upload, Check, AlertTriangle, X, FileText, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  validateTemplate, 
  checkRequiredFields, 
  templateToProgram,
  TEMPLATE_SCHEMA_VERSION 
} from './TemplateEngine';

// ============== TEMPLATE UPLOAD COMPONENT ==============
export const TemplateUploadView = ({ 
  onUpload, 
  onClose, 
  athleteProfile,
  existingTemplates = {},
  theme 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, validating, preview, error
  const [parsedTemplate, setParsedTemplate] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [profileCheck, setProfileCheck] = useState(null);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      setUploadState('error');
      return;
    }

    setUploadState('validating');
    setError(null);

    try {
      const text = await file.text();
      const template = JSON.parse(text);

      // Validate template structure
      const validation = validateTemplate(template);
      setValidationResult(validation);

      if (!validation.valid) {
        setError(`Template validation failed:\n${validation.errors.join('\n')}`);
        setUploadState('error');
        return;
      }

      // Check if template already exists
      if (existingTemplates[template.meta?.id]) {
        setError(`A template with ID "${template.meta.id}" already exists. Delete it first or use a different ID.`);
        setUploadState('error');
        return;
      }

      // Check required profile fields
      const profileResult = checkRequiredFields(template, athleteProfile);
      setProfileCheck(profileResult);

      setParsedTemplate(template);
      setUploadState('preview');

    } catch (err) {
      setError(`Failed to parse JSON: ${err.message}`);
      setUploadState('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const confirmUpload = () => {
    if (!parsedTemplate) return;

    // Convert template to program format and add to templates
    const program = templateToProgram(parsedTemplate, athleteProfile);
    
    onUpload({
      template: parsedTemplate,
      program,
      profileCheck
    });
  };

  const reset = () => {
    setUploadState('idle');
    setParsedTemplate(null);
    setValidationResult(null);
    setProfileCheck(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${theme.card} rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-lg font-bold ${theme.text}`}>Upload Program Template</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textMuted} hover:bg-gray-100 dark:hover:bg-gray-800`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Idle State - Drop Zone */}
          {uploadState === 'idle' && (
            <>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`block border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <Upload className={`mx-auto mb-3 ${theme.textMuted}`} size={40} />
                <p className={`font-medium ${theme.text}`}>Drop JSON template here</p>
                <p className={`text-sm ${theme.textMuted} mt-1`}>or click to browse</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              <div className={`flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20`}>
                <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Templates are read-only program blueprints. Upload a JSON file to add it to your template library.
                </p>
              </div>
            </>
          )}

          {/* Validating State */}
          {uploadState === 'validating' && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className={theme.text}>Validating template...</p>
            </div>
          )}

          {/* Error State */}
          {uploadState === 'error' && (
            <>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-300">Upload Failed</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={reset}
                className="w-full py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
              >
                Try Again
              </button>
            </>
          )}

          {/* Preview State */}
          {uploadState === 'preview' && parsedTemplate && (
            <>
              {/* Template Info */}
              <div className={`p-4 rounded-lg ${theme.cardAlt || 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{parsedTemplate.meta?.icon || '📋'}</span>
                  <div>
                    <h3 className={`font-bold ${theme.text}`}>{parsedTemplate.meta?.name}</h3>
                    <p className={`text-sm ${theme.textMuted}`}>v{parsedTemplate.meta?.version || '1.0'}</p>
                  </div>
                </div>
                {parsedTemplate.meta?.description && (
                  <p className={`text-sm ${theme.textMuted}`}>{parsedTemplate.meta.description}</p>
                )}
              </div>

              {/* Validation Warnings */}
              {validationResult?.warnings?.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-yellow-600" />
                    <span className="font-medium text-yellow-700 dark:text-yellow-300 text-sm">
                      {validationResult.warnings.length} Warning{validationResult.warnings.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                    {validationResult.warnings.slice(0, 3).map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                    {validationResult.warnings.length > 3 && (
                      <li>...and {validationResult.warnings.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Profile Completeness */}
              <div className={`p-4 rounded-lg border ${
                profileCheck?.complete 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {profileCheck?.complete ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <AlertTriangle size={16} className="text-orange-500" />
                    )}
                    <span className={`font-medium text-sm ${profileCheck?.complete ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                      Profile {profileCheck?.percentComplete}% Complete
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className={`p-1 rounded ${theme.textMuted}`}
                  >
                    {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {showDetails && (
                  <div className="mt-3 space-y-2">
                    {profileCheck?.present?.map(({ field, value }) => (
                      <div key={field} className="flex items-center justify-between text-xs">
                        <span className={theme.textMuted}>{field}</span>
                        <span className="text-green-600 dark:text-green-400">✓ {value}</span>
                      </div>
                    ))}
                    {profileCheck?.missing?.map(field => (
                      <div key={field} className="flex items-center justify-between text-xs">
                        <span className={theme.textMuted}>{field}</span>
                        <span className="text-orange-600 dark:text-orange-400">Missing</span>
                      </div>
                    ))}
                  </div>
                )}

                {!profileCheck?.complete && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    Some calculations will show percentages instead of exact weights until you update your profile.
                  </p>
                )}
              </div>

              {/* Template Structure Preview */}
              <div className={`p-3 rounded-lg ${theme.cardAlt || 'bg-gray-50 dark:bg-gray-800'}`}>
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className={`flex items-center justify-between w-full text-sm font-medium ${theme.text}`}
                >
                  <span>Template Contents</span>
                  {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {showDetails && (
                  <div className="mt-3 space-y-2 text-xs">
                    {parsedTemplate.blocks?.main_cycle && (
                      <div>
                        <span className={`font-medium ${theme.text}`}>Main Cycle: </span>
                        <span className={theme.textMuted}>
                          {parsedTemplate.blocks.main_cycle.map(b => b.name).join(' → ')}
                        </span>
                      </div>
                    )}
                    {parsedTemplate.blocks?.specialty && (
                      <div>
                        <span className={`font-medium ${theme.text}`}>Specialty Blocks: </span>
                        <span className={theme.textMuted}>
                          {parsedTemplate.blocks.specialty.length} available
                        </span>
                      </div>
                    )}
                    {parsedTemplate.blocks?.life && (
                      <div>
                        <span className={`font-medium ${theme.text}`}>Life Blocks: </span>
                        <span className={theme.textMuted}>
                          {parsedTemplate.blocks.life.length} available
                        </span>
                      </div>
                    )}
                    {parsedTemplate.phases && (
                      <div>
                        <span className={`font-medium ${theme.text}`}>Phases: </span>
                        <span className={theme.textMuted}>
                          {parsedTemplate.phases.map(p => p.name).join(' → ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className={`flex-1 py-2 px-4 rounded-lg border ${theme.text} font-medium`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpload}
                  className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Add Template
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateUploadView;
