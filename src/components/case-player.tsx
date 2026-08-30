import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Body, Button, Card, Divider, Eyebrow, ProgressBar, Screen, SectionTitle, Title, useTextScale } from '@/components/ui';
import { calculateScore } from '@/game/scoring';
import { getNextHint, isCorrectAnswer } from '@/game/investigation';
import { track } from '@/services/analytics';
import { useFeedback } from '@/services/feedback';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';
import type { CaseDefinition, CompletionRecord, GameMode, ScoreBreakdown } from '@/types/game';

type InvestigationTab = 'suspects' | 'evidence' | 'timeline' | 'notes' | 'decision';

export interface SolvedSummary {
  record: CompletionRecord;
  breakdown: ScoreBreakdown;
}

interface CasePlayerProps {
  caseFile: CaseDefinition;
  mode: GameMode;
  dateKey?: string;
  showIntro?: boolean;
  remainingSeconds?: number;
  continueLabel?: string;
  onContinue(summary: SolvedSummary): void;
  onSolved?(summary: SolvedSummary): void;
  onExit?(): void;
}

const TAB_META: Record<InvestigationTab, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  suspects: { label: 'People', icon: 'people-outline' },
  evidence: { label: 'Evidence', icon: 'folder-open-outline' },
  timeline: { label: 'Timeline', icon: 'time-outline' },
  notes: { label: 'Notes', icon: 'bookmark-outline' },
  decision: { label: 'Decide', icon: 'finger-print-outline' },
};

export function CasePlayer({
  caseFile,
  mode,
  dateKey,
  showIntro = true,
  remainingSeconds,
  continueLabel = mode === 'endless' ? 'Next endless case' : 'Return to case files',
  onContinue,
  onSolved,
  onExit,
}: CasePlayerProps) {
  const palette = usePalette();
  const scale = useTextScale();
  const feedback = useFeedback();
  const { startCase, completeCase } = useGame();
  const [phase, setPhase] = useState<'intro' | 'investigation' | 'results'>(showIntro ? 'intro' : 'investigation');
  const [tab, setTab] = useState<InvestigationTab>('suspects');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [summary, setSummary] = useState<SolvedSummary | null>(null);
  const startedAt = useRef<number | null>(null);
  const hasStarted = useRef(false);

  const beginInvestigation = () => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startedAt.current = Date.now();
      startCase(caseFile, mode);
      if (mode === 'daily') track('daily_started', { case_id: caseFile.id, date: dateKey ?? '' });
    }
    setPhase('investigation');
  };

  useEffect(() => {
    if (!showIntro && !hasStarted.current) {
      hasStarted.current = true;
      startedAt.current = Date.now();
      startCase(caseFile, mode);
      if (mode === 'daily') track('daily_started', { case_id: caseFile.id, date: dateKey ?? '' });
    }
    // A new case remounts this component with a new key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'investigation') return;
    const timer = setInterval(() => {
      if (startedAt.current) setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const availableTabs = useMemo<InvestigationTab[]>(
    () => caseFile.timeline.length ? ['suspects', 'evidence', 'timeline', 'notes', 'decision'] : ['suspects', 'evidence', 'notes', 'decision'],
    [caseFile.timeline.length],
  );

  const decisionOptions = useMemo(() => {
    switch (caseFile.answer.kind) {
      case 'suspect': return caseFile.suspects.map((item) => ({ id: item.id, label: item.name, detail: item.role }));
      case 'statement': return caseFile.statements.map((item) => ({ id: item.id, label: item.title, detail: item.text }));
      case 'evidence': return caseFile.evidence.map((item) => ({ id: item.id, label: item.title, detail: item.description }));
      case 'timeline': return caseFile.timeline.map((item) => ({ id: item.id, label: item.title, detail: item.time }));
    }
  }, [caseFile]);

  const toggleHighlight = (id: string, effect: 'tap' | 'clue' = 'tap') => {
    feedback.play(effect);
    setHighlights((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const revealHint = () => {
    const hint = getNextHint(caseFile, hintsUsed);
    if (!hint) return;
    setHintsUsed((count) => count + 1);
    setFeedbackMessage(hint.text);
    if (hint.focusId) setHighlights((current) => current.includes(hint.focusId!) ? current : [...current, hint.focusId!]);
    feedback.play('clue');
    track('hint_used', { case_id: caseFile.id, hint_number: hintsUsed + 1, mode });
  };

  const confirmDecision = () => {
    if (!selectedTarget) return;
    if (!isCorrectAnswer(caseFile, selectedTarget)) {
      const nextWrong = wrongGuesses + 1;
      setWrongGuesses(nextWrong);
      setSelectedTarget(null);
      setFeedbackMessage(nextWrong === 1 ? `Not quite. ${caseFile.hints[0]!.text}` : 'That conclusion still fits the evidence. Test another contradiction.');
      feedback.play('incorrect');
      track('wrong_guess', { case_id: caseFile.id, mode, guess_number: nextWrong });
      track('case_failed', { case_id: caseFile.id, mode, recoverable: true });
      return;
    }

    const finalElapsed = Math.max(1, startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : elapsedSeconds);
    const breakdown = calculateScore({
      difficulty: caseFile.difficulty,
      elapsedSeconds: finalElapsed,
      targetSeconds: caseFile.estimatedSeconds,
      wrongGuesses,
      hintsUsed,
    });
    const record = completeCase(caseFile, {
      score: breakdown.total,
      elapsedSeconds: finalElapsed,
      wrongGuesses,
      hintsUsed,
      firstTry: wrongGuesses === 0,
    }, mode, dateKey);
    const solvedSummary = { record, breakdown };
    setSummary(solvedSummary);
    setPhase('results');
    feedback.play('correct');
    onSolved?.(solvedSummary);
  };

  if (phase === 'intro') {
    return (
      <Screen>
        <View style={styles.introTop}>
          {onExit ? <Button label="Exit" icon="close" variant="ghost" compact onPress={onExit} /> : null}
          <View style={styles.introBadges}>
            <Badge label={caseFile.difficulty} tone="gold" />
            <Badge label={caseFile.type} />
          </View>
          <Eyebrow>Case file Â· {caseFile.location}</Eyebrow>
          <Title>{caseFile.title}</Title>
          <Body muted style={styles.introText}>{caseFile.introduction}</Body>
        </View>
        <Card paper style={styles.objectiveCard}>
          <Text style={[styles.objectiveLabel, { color: palette.crimson, fontSize: 11 * scale }]}>YOUR OBJECTIVE</Text>
          <Text style={[styles.objectiveText, { color: palette.paperText, fontSize: 19 * scale, lineHeight: 27 * scale }]}>{caseFile.objective}</Text>
        </Card>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}><Ionicons name="people-outline" color={palette.gold} size={20} /><Body>{caseFile.suspects.length} people</Body></View>
          <View style={styles.metaItem}><Ionicons name="time-outline" color={palette.gold} size={20} /><Body>~{Math.ceil(caseFile.estimatedSeconds / 60)} min</Body></View>
          <View style={styles.metaItem}><Ionicons name="bulb-outline" color={palette.gold} size={20} /><Body>{caseFile.hints.length} hints</Body></View>
        </View>
        <Button label="Open the case" icon="folder-open" onPress={beginInvestigation} style={styles.primaryCta} />
      </Screen>
    );
  }

  if (phase === 'results' && summary) {
    const { record, breakdown } = summary;
    return (
      <Screen>
        <View style={styles.resultHero}>
          <View style={[styles.resultSeal, { borderColor: palette.success, backgroundColor: `${palette.success}22` }]}>
            <Ionicons name="checkmark" color={palette.success} size={42} />
          </View>
          <Eyebrow>Case closed</Eyebrow>
          <Title style={styles.resultTitle}>{caseFile.answer.label}</Title>
          <Body muted style={styles.resultCenter}>{caseFile.contradiction}</Body>
        </View>

        <Card paper>
          <Text style={[styles.reasoningLabel, { color: palette.crimson, fontSize: 11 * scale }]}>THE REASONING</Text>
          <Text style={[styles.reasoningText, { color: palette.paperText, fontSize: 16 * scale, lineHeight: 25 * scale }]}>{caseFile.explanation}</Text>
        </Card>

        <SectionTitle>Case score</SectionTitle>
        <Card>
          <View style={styles.scoreTop}>
            <Text style={[styles.scoreValue, { color: palette.gold, fontSize: 42 * scale }]}>{record.score.toLocaleString()}</Text>
            <View><Badge label={`+${record.xpEarned} XP`} tone="success" /></View>
          </View>
          <Divider />
          <ScoreRow label="Base score" value={breakdown.base} />
          <ScoreRow label="Difficulty bonus" value={breakdown.difficultyBonus} positive />
          <ScoreRow label="First-try bonus" value={breakdown.firstTryBonus} positive />
          <ScoreRow label="No-hint bonus" value={breakdown.noHintBonus} positive />
          <ScoreRow label="Speed bonus" value={breakdown.speedBonus} positive />
          <ScoreRow label="Wrong guesses" value={breakdown.wrongGuessPenalty} penalty />
          <ScoreRow label="Hints" value={breakdown.hintPenalty} penalty />
          <ScoreRow label="Time" value={breakdown.timePenalty} penalty />
        </Card>

        <View style={styles.resultStats}>
          <ResultStat icon="time-outline" value={formatTime(record.elapsedSeconds)} label="Time" />
          <ResultStat icon="bulb-outline" value={record.hintsUsed} label="Hints" />
          <ResultStat icon="close-circle-outline" value={record.wrongGuesses} label="Wrong" />
        </View>
        <Button label={continueLabel} icon="arrow-forward" onPress={() => onContinue(summary)} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentStyle={styles.investigationScreen}>
      <View style={styles.investigationHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="Exit investigation" onPress={onExit} style={[styles.exitButton, { borderColor: palette.border }]}>
          <Ionicons name="close" color={palette.text} size={22} />
        </Pressable>
        <View style={styles.caseHeading}>
          <Text numberOfLines={1} style={[styles.caseHeadingTitle, { color: palette.text, fontSize: 16 * scale }]}>{caseFile.title}</Text>
          <Text style={[styles.caseHeadingMeta, { color: palette.muted, fontSize: 11 * scale }]}>{caseFile.type} Â· {caseFile.difficulty}</Text>
        </View>
        <View style={styles.timerWrap}>
          <Ionicons name="time-outline" color={remainingSeconds !== undefined && remainingSeconds < 20 ? palette.crimson : palette.gold} size={17} />
          <Text style={[styles.timer, { color: palette.text, fontSize: 14 * scale }]}>{formatTime(remainingSeconds ?? elapsedSeconds)}</Text>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: palette.surface, borderColor: palette.border }]} accessibilityRole="tablist">
        {availableTabs.map((item) => {
          const active = item === tab;
          return (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={TAB_META[item].label}
              onPress={() => { feedback.play('tap'); setTab(item); setFeedbackMessage(null); }}
              style={[styles.tab, active && { backgroundColor: palette.elevated }]}
            >
              <Ionicons name={TAB_META[item].icon} size={19} color={active ? palette.gold : palette.muted} />
              <Text numberOfLines={1} style={[styles.tabLabel, { color: active ? palette.text : palette.muted, fontSize: 10 * scale }]}>{TAB_META[item].label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.investigationBody} contentContainerStyle={styles.investigationContent}>
        {feedbackMessage ? (
          <View accessibilityLiveRegion="polite" style={[styles.feedbackBox, { backgroundColor: `${palette.gold}12`, borderColor: palette.goldSoft }]}>
            <Ionicons name="information-circle-outline" size={20} color={palette.gold} />
            <Body style={styles.feedbackText}>{feedbackMessage}</Body>
          </View>
        ) : null}
        {tab === 'suspects' ? <SuspectsTab caseFile={caseFile} highlights={highlights} toggleHighlight={toggleHighlight} /> : null}
        {tab === 'evidence' ? <EvidenceTab caseFile={caseFile} highlights={highlights} toggleHighlight={toggleHighlight} /> : null}
        {tab === 'timeline' ? <TimelineTab caseFile={caseFile} highlights={highlights} toggleHighlight={toggleHighlight} /> : null}
        {tab === 'notes' ? <NotesTab caseFile={caseFile} highlights={highlights} toggleHighlight={toggleHighlight} /> : null}
        {tab === 'decision' ? (
          <DecisionTab
            caseFile={caseFile}
            options={decisionOptions}
            selectedTarget={selectedTarget}
            setSelectedTarget={setSelectedTarget}
            confirm={confirmDecision}
          />
        ) : null}
      </ScrollView>

      <View style={[styles.investigationFooter, { borderTopColor: palette.border, backgroundColor: palette.background }]}>
        <View style={styles.hintProgress}>
          <Text style={[styles.hintText, { color: palette.muted, fontSize: 11 * scale }]}>Hints {hintsUsed}/{caseFile.hints.length}</Text>
          <ProgressBar value={hintsUsed / caseFile.hints.length} accessibilityLabel={`${hintsUsed} of ${caseFile.hints.length} hints used`} />
        </View>
        <Button label={hintsUsed < caseFile.hints.length ? 'Use hint' : 'No hints left'} icon="bulb-outline" variant="secondary" compact disabled={hintsUsed >= caseFile.hints.length} onPress={revealHint} />
      </View>
    </Screen>
  );
}

function SuspectsTab({ caseFile, highlights, toggleHighlight }: TabProps) {
  const palette = usePalette();
  const scale = useTextScale();
  return (
    <View>
      <SectionTitle>People and statements</SectionTitle>
      <Body muted>Mark anything suspicious. Your highlights are collected in Notes.</Body>
      <View style={styles.cardList}>
        {caseFile.suspects.map((suspect) => {
          const statement = caseFile.statements.find((item) => item.suspectId === suspect.id)!;
          const marked = highlights.includes(statement.id);
          return (
            <Card key={suspect.id}>
              <View style={styles.personTop}>
                <View style={[styles.avatar, { backgroundColor: suspect.accent }]}><Text style={styles.avatarText}>{initials(suspect.name)}</Text></View>
                <View style={styles.personCopy}>
                  <Text style={[styles.personName, { color: palette.text, fontSize: 17 * scale }]}>{suspect.name}</Text>
                  <Text style={[styles.personRole, { color: palette.gold, fontSize: 11 * scale }]}>{suspect.role.toUpperCase()}</Text>
                </View>
                <MarkButton marked={marked} onPress={() => toggleHighlight(statement.id)} />
              </View>
              <Body muted style={styles.personDescription}>{suspect.description}</Body>
              <View style={[styles.statement, { borderLeftColor: marked ? palette.crimson : palette.goldSoft }]}>
                <Text style={[styles.quote, { color: palette.text, fontSize: 15 * scale, lineHeight: 23 * scale }]}>&ldquo;{statement.text}&rdquo;</Text>
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}

function EvidenceTab({ caseFile, highlights, toggleHighlight }: TabProps) {
  const palette = usePalette();
  const scale = useTextScale();
  const opened = useRef(new Set<string>());
  return (
    <View>
      <SectionTitle>Evidence board</SectionTitle>
      <Body muted>All facts needed to solve the case are shown here.</Body>
      <View style={styles.evidenceGrid}>
        {caseFile.evidence.map((item) => {
          const marked = highlights.includes(item.id);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.description}. ${marked ? 'Marked important.' : 'Not marked.'}`}
              onPress={() => {
                toggleHighlight(item.id, 'clue');
                if (!opened.current.has(item.id)) {
                  opened.current.add(item.id);
                  track('evidence_opened', { case_id: caseFile.id, evidence_id: item.id });
                }
              }}
              style={({ pressed }) => [styles.evidencePressable, pressed && styles.pressOpacity]}
            >
              <Card paper style={[styles.evidenceCard, marked && { borderColor: palette.crimson, borderWidth: 2 }]}>
                <View style={styles.evidenceHeading}>
                  <Ionicons name={evidenceIcon(item.type)} size={24} color={palette.crimson} />
                  <Text style={[styles.evidenceTitle, { color: palette.paperText, fontSize: 16 * scale }]}>{item.title}</Text>
                  <Ionicons name={marked ? 'bookmark' : 'bookmark-outline'} size={20} color={marked ? palette.crimson : palette.paperText} />
                </View>
                <Text style={[styles.evidenceBody, { color: palette.paperText, fontSize: 14 * scale, lineHeight: 21 * scale }]}>{item.description}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TimelineTab({ caseFile, highlights, toggleHighlight }: TabProps) {
  const palette = usePalette();
  const scale = useTextScale();
  return (
    <View>
      <SectionTitle>Established timeline</SectionTitle>
      <View style={styles.timeline}>
        {caseFile.timeline.map((event, index) => {
          const marked = highlights.includes(event.id);
          return (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: marked ? palette.crimson : palette.gold }]} />
                {index < caseFile.timeline.length - 1 ? <View style={[styles.timelineLine, { backgroundColor: palette.borderStrong }]} /> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${event.time}, ${event.title}. ${event.description}`}
                onPress={() => toggleHighlight(event.id)}
                style={({ pressed }) => [styles.timelineContent, { borderColor: marked ? palette.crimson : palette.border, backgroundColor: palette.surface }, pressed && styles.pressOpacity]}
              >
                <View style={styles.timelineTitleRow}>
                  <Text style={[styles.timelineTime, { color: palette.gold, fontSize: 14 * scale }]}>{event.time}</Text>
                  <Text style={[styles.timelineTitle, { color: palette.text, fontSize: 16 * scale }]}>{event.title}</Text>
                  <Ionicons name={marked ? 'bookmark' : 'bookmark-outline'} size={18} color={marked ? palette.crimson : palette.muted} />
                </View>
                <Body muted>{event.description}</Body>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function NotesTab({ caseFile, highlights, toggleHighlight }: TabProps) {
  const palette = usePalette();
  const highlighted = [
    ...caseFile.statements.map((item) => ({ id: item.id, title: item.title, body: item.text, kind: 'Statement' })),
    ...caseFile.evidence.map((item) => ({ id: item.id, title: item.title, body: item.description, kind: 'Evidence' })),
    ...caseFile.timeline.map((item) => ({ id: item.id, title: `${item.time} Â· ${item.title}`, body: item.description, kind: 'Timeline' })),
  ].filter((item) => highlights.includes(item.id));
  return (
    <View>
      <SectionTitle>Detective notes</SectionTitle>
      <Body muted>Your lightweight case board. Tap the bookmark to remove an item.</Body>
      {highlighted.length === 0 ? (
        <Card style={styles.notesEmpty}>
          <Ionicons name="bookmark-outline" size={32} color={palette.gold} />
          <Body muted style={styles.resultCenter}>Nothing marked yet. Bookmark a statement, clue, or event while investigating.</Body>
        </Card>
      ) : (
        <View style={styles.cardList}>
          {highlighted.map((item) => (
            <Card key={item.id}>
              <View style={styles.noteTop}>
                <Badge label={item.kind} />
                <MarkButton marked onPress={() => toggleHighlight(item.id)} />
              </View>
              <Text style={[styles.noteTitle, { color: palette.text }]}>{item.title}</Text>
              <Body muted>{item.body}</Body>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

function DecisionTab({ caseFile, options, selectedTarget, setSelectedTarget, confirm }: {
  caseFile: CaseDefinition;
  options: { id: string; label: string; detail: string }[];
  selectedTarget: string | null;
  setSelectedTarget(value: string): void;
  confirm(): void;
}) {
  const palette = usePalette();
  const scale = useTextScale();
  return (
    <View>
      <SectionTitle>Make your deduction</SectionTitle>
      <Card style={[styles.decisionPrompt, { borderColor: palette.goldSoft }]}>
        <Eyebrow>Question</Eyebrow>
        <Text style={[styles.decisionQuestion, { color: palette.text, fontSize: 21 * scale }]}>{caseFile.decisionPrompt}</Text>
      </Card>
      <View style={styles.cardList}>
        {options.map((option) => {
          const selected = selectedTarget === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${option.label}. ${option.detail}`}
              onPress={() => { setSelectedTarget(option.id); track(caseFile.answer.kind === 'suspect' ? 'suspect_selected' : 'evidence_opened', { case_id: caseFile.id, target_id: option.id }); }}
              style={({ pressed }) => [styles.choice, { backgroundColor: selected ? `${palette.gold}1E` : palette.surface, borderColor: selected ? palette.gold : palette.border }, pressed && styles.pressOpacity]}
            >
              <View style={[styles.radio, { borderColor: selected ? palette.gold : palette.muted }]}>{selected ? <View style={[styles.radioInner, { backgroundColor: palette.gold }]} /> : null}</View>
              <View style={styles.choiceCopy}>
                <Text style={[styles.choiceLabel, { color: palette.text, fontSize: 16 * scale }]}>{option.label}</Text>
                <Text numberOfLines={2} style={[styles.choiceDetail, { color: palette.muted, fontSize: 12 * scale }]}>{option.detail}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Button label="Confirm conclusion" icon="checkmark-circle-outline" disabled={!selectedTarget} onPress={confirm} style={styles.confirmButton} />
    </View>
  );
}

interface TabProps {
  caseFile: CaseDefinition;
  highlights: string[];
  toggleHighlight(id: string, effect?: 'tap' | 'clue'): void;
}

function MarkButton({ marked, onPress }: { marked: boolean; onPress(): void }) {
  const palette = usePalette();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={marked ? 'Remove from notes' : 'Mark as important'} hitSlop={10} onPress={onPress} style={styles.markButton}>
      <Ionicons name={marked ? 'bookmark' : 'bookmark-outline'} color={marked ? palette.crimson : palette.muted} size={22} />
    </Pressable>
  );
}

function ScoreRow({ label, value, positive, penalty }: { label: string; value: number; positive?: boolean; penalty?: boolean }) {
  const palette = usePalette();
  return (
    <View style={styles.scoreRow}>
      <Body muted>{label}</Body>
      <Body style={{ color: penalty && value ? palette.crimson : positive && value ? palette.success : palette.text }}>
        {penalty && value ? 'âˆ’' : positive && value ? '+' : ''}{value.toLocaleString()}
      </Body>
    </View>
  );
}

function ResultStat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string }) {
  const palette = usePalette();
  return (
    <View style={[styles.resultStat, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <Ionicons name={icon} color={palette.gold} size={20} />
      <Body>{value}</Body>
      <Text style={[styles.resultStatLabel, { color: palette.muted }]}>{label}</Text>
    </View>
  );
}

function evidenceIcon(type: CaseDefinition['evidence'][number]['type']): keyof typeof Ionicons.glyphMap {
  if (type === 'record') return 'document-text-outline';
  if (type === 'object') return 'cube-outline';
  if (type === 'message') return 'chatbubble-ellipses-outline';
  if (type === 'weather') return 'rainy-outline';
  if (type === 'photo') return 'image-outline';
  if (type === 'map') return 'map-outline';
  return 'eye-outline';
}

function initials(name: string): string {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  introTop: { paddingTop: 18, paddingBottom: 8 },
  introBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 18 },
  introText: { marginTop: 16, maxWidth: 680 },
  objectiveCard: { marginTop: 22 },
  objectiveLabel: { fontWeight: '900', letterSpacing: 1.8, marginBottom: 8 },
  objectiveText: { fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginVertical: 24 },
  metaItem: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  primaryCta: { marginTop: 4 },
  resultHero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  resultSeal: { width: 78, height: 78, borderWidth: 2, borderRadius: 39, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  resultTitle: { textAlign: 'center' },
  resultCenter: { textAlign: 'center', marginTop: 10 },
  reasoningLabel: { fontWeight: '900', letterSpacing: 1.8, marginBottom: 8 },
  reasoningText: { fontWeight: '500' },
  scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreValue: { fontWeight: '900', letterSpacing: -1 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  resultStats: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  resultStat: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 2 },
  resultStatLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  investigationScreen: { paddingHorizontal: 0, paddingBottom: 0, maxWidth: 1000 },
  investigationHeader: { height: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  exitButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 21 },
  caseHeading: { flex: 1 },
  caseHeadingTitle: { fontWeight: '800' },
  caseHeadingMeta: { marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  timerWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timer: { fontVariant: ['tabular-nums'], fontWeight: '800' },
  tabBar: { marginHorizontal: 12, padding: 4, flexDirection: 'row', borderWidth: 1, borderRadius: 14 },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 2, paddingHorizontal: 2 },
  tabLabel: { fontWeight: '700' },
  investigationBody: { flex: 1 },
  investigationContent: { paddingHorizontal: 16, paddingBottom: 24 },
  investigationFooter: { minHeight: 66, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, gap: 14 },
  hintProgress: { flex: 1, gap: 6 },
  hintText: { textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  feedbackBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, borderWidth: 1, borderRadius: 12, marginTop: 14 },
  feedbackText: { flex: 1 },
  cardList: { gap: 12, marginTop: 16 },
  personTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF8EF', fontWeight: '900', letterSpacing: 0.5 },
  personCopy: { flex: 1 },
  personName: { fontWeight: '800' },
  personRole: { fontWeight: '800', letterSpacing: 1 },
  markButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  personDescription: { marginTop: 10 },
  statement: { borderLeftWidth: 3, paddingLeft: 13, marginTop: 13 },
  quote: { fontStyle: 'italic', fontWeight: '500' },
  evidenceGrid: { gap: 12, marginTop: 16 },
  evidencePressable: { width: '100%' },
  evidenceCard: { minHeight: 126 },
  evidenceHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  evidenceTitle: { fontWeight: '800', flex: 1 },
  evidenceBody: { marginTop: 12 },
  pressOpacity: { opacity: 0.72 },
  timeline: { marginTop: 8 },
  timelineRow: { flexDirection: 'row', minHeight: 100 },
  timelineRail: { width: 28, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 20 },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineContent: { flex: 1, borderWidth: 1, borderRadius: 13, padding: 13, marginBottom: 10 },
  timelineTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 5 },
  timelineTime: { fontWeight: '900', fontVariant: ['tabular-nums'] },
  timelineTitle: { flex: 1, fontWeight: '800' },
  notesEmpty: { marginTop: 22, minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  noteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteTitle: { fontWeight: '800', fontSize: 16, marginBottom: 5 },
  decisionPrompt: { marginTop: 4 },
  decisionQuestion: { fontWeight: '800', lineHeight: 29 },
  choice: { minHeight: 72, borderWidth: 1, borderRadius: 13, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 11, height: 11, borderRadius: 6 },
  choiceCopy: { flex: 1 },
  choiceLabel: { fontWeight: '800' },
  choiceDetail: { marginTop: 3, lineHeight: 18 },
  confirmButton: { marginTop: 18 },
});

