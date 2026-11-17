import React, { useState } from 'react';
import {
  TrendingUp,
  MapPin,
  FileText,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Calendar,
  Video,
  Clock,
  CheckCircle2,
  User,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthenticatedDocumentPreview } from '../../components/AuthenticatedDocumentPreview';

interface ScalingConsultationModalContentProps {
  selectedReq: any;
  scalingDoc: any;
  isUpdating: boolean;
  onMarkUnderReview: () => Promise<void>;
  onScheduleMeeting: (e: React.FormEvent) => Promise<void>;
  onCancelMeeting: () => Promise<void>;
  onCompleteMeeting: (e: React.FormEvent) => Promise<void>;
  meetingDate: string;
  setMeetingDate: (val: string) => void;
  meetingTime: string;
  setMeetingTime: (val: string) => void;
  meetingDuration: string;
  setMeetingDuration: (val: string) => void;
  meetingMode: 'VIRTUAL' | 'IN_PERSON';
  setMeetingMode: (val: 'VIRTUAL' | 'IN_PERSON') => void;
  meetingLinkOrLocation: string;
  setMeetingLinkOrLocation: (val: string) => void;
  meetingNotes: string;
  setMeetingNotes: (val: string) => void;
  isRescheduling: boolean;
  setIsRescheduling: (val: boolean) => void;
  completionSummary: string;
  setCompletionSummary: (val: string) => void;
  adminNotes: string;
  setAdminNotes: (val: string) => void;
}

export const ScalingConsultationModalContent: React.FC<ScalingConsultationModalContentProps> = ({
  selectedReq,
  scalingDoc,
  isUpdating,
  onMarkUnderReview,
  onScheduleMeeting,
  onCancelMeeting,
  onCompleteMeeting,
  meetingDate,
  setMeetingDate,
  meetingTime,
  setMeetingTime,
  meetingDuration,
  setMeetingDuration,
  meetingMode,
  setMeetingMode,
  meetingLinkOrLocation,
  setMeetingLinkOrLocation,
  meetingNotes,
  setMeetingNotes,
  isRescheduling,
  setIsRescheduling,
  completionSummary,
  setCompletionSummary,
  adminNotes,
  setAdminNotes,
}) => {
  const [viewingDocument, setViewingDocument] = useState<any | null>(null);
  const currentStatus = scalingDoc?.status || selectedReq?.status || 'SUBMITTED';

  return (
    <>
      {/* Submitter & Advisory Info Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-sm flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {scalingDoc?.submitterName || selectedReq.requesterName}
              </p>
              {scalingDoc?.currentBusinessStage && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {scalingDoc.currentBusinessStage}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {scalingDoc?.submitterEmail || selectedReq.requesterEmail} •{' '}
              {scalingDoc?.submitterPhone || selectedReq.requesterId?.phone || '+91 Verified Member'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            <span>Direct 1-on-1 FIC Advisory Consultation</span>
          </span>
        </div>
      </div>

      {/* Business Information & Scaling Overview Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 font-mono uppercase tracking-wider block">
              Business Enterprise
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {scalingDoc?.businessName || selectedReq.title}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {scalingDoc?.scalingSupportType || 'General Business Scaling'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Registered Sector
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {scalingDoc?.mainCategoryName || 'Business & Enterprise'}
            </p>
            {scalingDoc?.subcategoryName && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {scalingDoc.subcategoryName}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Current Base Location
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{scalingDoc?.currentBusinessLocation || 'Not specified'}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Target Expansion Regions
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>{scalingDoc?.targetExpansionCities || 'Regional & National Growth'}</span>
            </p>
          </div>
        </div>

        {scalingDoc?.businessDescription && (
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Business Model & Overview
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
              {scalingDoc.businessDescription}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            Specific Scaling Challenges & Requirements
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800 font-sans">
            {scalingDoc?.specificScalingChallenges || selectedReq.description}
          </p>
        </div>

        {/* Supporting Documents */}
        {scalingDoc?.supportingDocuments && scalingDoc.supportingDocuments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Attached Documents & Pitch Decks ({scalingDoc.supportingDocuments.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scalingDoc.supportingDocuments.map((doc: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {doc.name || 'Document'}
                      </p>
                      <p className="text-[10px] text-slate-400">{doc.fileType || 'PDF / Attachment'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingDocument(doc)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4-Stage Scaling Progress Visualizer */}
      <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Consultation Progress Workflow</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Direct Member & Coordinator Flow
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {/* Stage 1 */}
          <div
            className={`p-2.5 rounded-xl border font-semibold transition-all ${
              currentStatus === 'SUBMITTED'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 ring-1 ring-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <div className="font-mono text-[10px] opacity-75">Stage 1</div>
            <div className="truncate font-bold">1. Submitted</div>
          </div>

          {/* Stage 2 */}
          <div
            className={`p-2.5 rounded-xl border font-semibold transition-all ${
              currentStatus === 'UNDER_REVIEW'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400'
                : currentStatus === 'MEETING_SCHEDULED' || currentStatus === 'MEETING_COMPLETED' || currentStatus === 'COMPLETED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <div className="font-mono text-[10px] opacity-75">Stage 2</div>
            <div className="truncate font-bold">2. Under Review</div>
          </div>

          {/* Stage 3 */}
          <div
            className={`p-2.5 rounded-xl border font-semibold transition-all ${
              currentStatus === 'MEETING_SCHEDULED'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 ring-1 ring-purple-400'
                : currentStatus === 'MEETING_COMPLETED' || currentStatus === 'COMPLETED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <div className="font-mono text-[10px] opacity-75">Stage 3</div>
            <div className="truncate font-bold">3. Meeting Booked</div>
          </div>

          {/* Stage 4 */}
          <div
            className={`p-2.5 rounded-xl border font-semibold transition-all ${
              currentStatus === 'MEETING_COMPLETED' || currentStatus === 'COMPLETED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <div className="font-mono text-[10px] opacity-75">Stage 4</div>
            <div className="truncate font-bold">4. Concluded</div>
          </div>
        </div>
      </div>

      {/* Under Review Action Banner */}
      {currentStatus === 'SUBMITTED' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2.5 text-xs text-amber-800 dark:text-amber-200">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">New Scaling Request Awaiting Review</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Mark this request as Under Review to notify the member that the coordinator team is evaluating their scaling needs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onMarkUnderReview}
            disabled={isUpdating}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Mark as Under Review</span>
          </button>
        </div>
      )}

      {/* Consultation Meeting Scheduling / Details */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-2.5 flex-wrap gap-2">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>1-on-1 Consultation Session</span>
          </div>

          {currentStatus === 'MEETING_SCHEDULED' && !isRescheduling && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRescheduling(true)}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 transition-colors"
              >
                Reschedule
              </button>
              <button
                type="button"
                onClick={onCancelMeeting}
                disabled={isUpdating}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors"
              >
                Cancel Meeting
              </button>
            </div>
          )}
        </div>

        {/* If Meeting is Scheduled and not Rescheduling */}
        {currentStatus === 'MEETING_SCHEDULED' && !isRescheduling ? (
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 dark:text-purple-200 text-xs flex items-center gap-1.5">
                {meetingMode === 'IN_PERSON' ? (
                  <MapPin className="w-4 h-4 text-purple-600" />
                ) : (
                  <Video className="w-4 h-4 text-purple-600" />
                )}
                <span>
                  {meetingMode === 'IN_PERSON'
                    ? 'In-Person Consultation'
                    : 'Virtual Video Consultation'}
                </span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                CONFIRMED & SCHEDULED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 font-semibold text-slate-800 dark:text-slate-200">
              <div>
                <span className="text-slate-500 font-normal">Session Timing: </span>
                {meetingDate} at {meetingTime} ({meetingDuration} mins)
              </div>
              <div>
                <span className="text-slate-500 font-normal">
                  {meetingMode === 'IN_PERSON' ? 'Location: ' : 'Meet Link: '}
                </span>
                {meetingMode === 'VIRTUAL' && meetingLinkOrLocation ? (
                  <a
                    href={
                      meetingLinkOrLocation.startsWith('http')
                        ? meetingLinkOrLocation
                        : `https://${meetingLinkOrLocation}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 underline hover:opacity-80 inline-flex items-center gap-1"
                  >
                    <span>{meetingLinkOrLocation}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span>{meetingLinkOrLocation || 'FIC Regional Hub'}</span>
                )}
              </div>
            </div>

            {meetingNotes && (
              <div className="text-[11px] text-slate-600 dark:text-slate-400 italic border-t border-purple-200 dark:border-purple-900/60 pt-2">
                Notes: "{meetingNotes}"
              </div>
            )}
          </div>
        ) : currentStatus === 'MEETING_COMPLETED' || currentStatus === 'COMPLETED' ? (
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Consultation Completed</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                FINISHED
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              The scaling consultation was conducted on {meetingDate || 'scheduled date'}. The strategic recommendations have been recorded and delivered to the member.
            </p>
          </div>
        ) : (
          /* Schedule or Reschedule Form */
          <form onSubmit={onScheduleMeeting} className="space-y-3.5">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isRescheduling
                ? 'Select a new date, time, and mode to reschedule the consultation session. The member will be notified immediately.'
                : 'Arrange a 1-on-1 advisory session with the member to diagnose scaling bottlenecks and plan business growth.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Meeting Date *
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Meeting Time *
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Duration
                </label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Meeting Mode *
                </label>
                <select
                  value={meetingMode}
                  onChange={(e: any) => setMeetingMode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="VIRTUAL">Virtual (Google Meet / Online Call)</option>
                  <option value="IN_PERSON">In-Person (FIC Hub / Office)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  {meetingMode === 'IN_PERSON'
                    ? 'Location / Office Address'
                    : 'Google Meet Link (Auto if blank)'}
                </label>
                <input
                  type="text"
                  value={meetingLinkOrLocation}
                  onChange={(e) => setMeetingLinkOrLocation(e.target.value)}
                  placeholder={
                    meetingMode === 'IN_PERSON'
                      ? 'e.g., FIC Regional Hub, Floor 3'
                      : 'https://meet.google.com/fic-...'
                  }
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                Consultation Agenda / Notes
              </label>
              <input
                type="text"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="e.g., Expansion strategy review and market feasibility discussion..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {isRescheduling && (
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {isRescheduling
                    ? 'Confirm Rescheduled Time'
                    : 'Schedule Consultation & Notify Member'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Meeting Outcome & Completion Form */}
      {currentStatus === 'MEETING_SCHEDULED' && (
        <form
          onSubmit={onCompleteMeeting}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3.5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Conclude Consultation & Record Recommendations</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Final Workflow Step</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Once the advisory consultation is completed, record the discussion takeaways and guidance given. Completing this concludes the Scaling Request workflow.
          </p>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
              Discussion Outcome & Advice Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={completionSummary}
              onChange={(e) => setCompletionSummary(e.target.value)}
              placeholder="Detail the key diagnostic insights, growth roadmap discussed, recommended marketing/funding next steps, and action items given to the member (visible in Member Portal)..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              Private Coordinator Notes (Optional / Internal Only)
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes regarding founder readiness, follow-up recommendations, or internal team notes..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isUpdating || !completionSummary.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Meeting as Completed (Finish Workflow)</span>
            </button>
          </div>
        </form>
      )}

      {/* Completed Outcome Summary Display */}
      {(currentStatus === 'MEETING_COMPLETED' || currentStatus === 'COMPLETED') && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/60 pb-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Delivered Advice & Outcome Summary</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              WORKFLOW CONCLUDED
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            {scalingDoc?.completionSummary ||
              completionSummary ||
              'Consultation conducted and strategic guidance delivered.'}
          </div>

          {(scalingDoc?.adminNotes || adminNotes) && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-[10px] uppercase text-slate-400 block mb-0.5">
                Internal Coordinator Notes:
              </span>
              {scalingDoc?.adminNotes || adminNotes}
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Important: The Scaling workflow ends after the meeting is completed. No further marketplace publishing or provider assignments apply.
          </p>
        </div>
      )}

      {/* In-App Document Inspection / Preview Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                    {viewingDocument.name || viewingDocument.fileName || 'Supporting Document'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{viewingDocument.fileType || 'Document'}</span>
                    {viewingDocument.fileSize && (
                      <span>&bull; {(viewingDocument.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingDocument(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-5 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
              <AuthenticatedDocumentPreview
                documentId={viewingDocument.documentId || viewingDocument.fileUrl?.match(/\/documents\/([A-Za-z0-9_-]+)/)?.[1]}
                fileUrl={viewingDocument.fileUrl}
                fileName={viewingDocument.name || viewingDocument.fileName}
                originalMimeType={viewingDocument.fileType}
                title={viewingDocument.name}
                maxHeightClass="max-h-[68vh]"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-850 shrink-0">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Confidential Scaling Consultation Asset &bull; Private Vault Protected
              </div>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Close Document
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

