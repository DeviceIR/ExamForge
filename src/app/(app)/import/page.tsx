"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  KeyRound,
  FileText,
  PenLine,
  FolderOpen,
  Trash2,
  Pencil,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { PageHeader, SectionTitle } from "@/components/shared";
import {
  Card,
  CardContent,
  Button,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
} from "@/components/ui";
import {
  parseAnswerKeyJSON,
  parseAnswerKeyCSV,
  parseQuestionsJSON,
  parseQuestionsCSV,
  applyAnswerKey,
} from "@/lib/importers";
import { parseQuestionsText } from "@/lib/text-parser";
import { importToQuestions, resolveCourse } from "@/lib/question-utils";
import { QuestionEditor } from "@/components/library/question-editor";
import { ExamSetEditor } from "@/components/library/exam-set-editor";
import { useTranslation, formatLocalizedNumber } from "@/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ImportType = "key" | "questions";
type Format = "json" | "csv";

const SAMPLE_KEY_JSON = `{
  "year": 1,
  "course": "Math",
  "questions": [
    { "id": 1, "answer": 2 },
    { "id": 2, "answer": 1 }
  ]
}`;

const SAMPLE_Q_JSON = `{
  "year": 1,
  "course": "Math",
  "questions": [
    {
      "number": 1,
      "prompt": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1,
      "difficulty": "easy",
      "topic": "Arithmetic"
    }
  ]
}`;

const SAMPLE_TEXT = `1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B

2. Which planet is closest to the Sun?
A) Venus
B) Earth
C) Mercury
D) Mars
Answer: C`;

export default function LibraryPage() {
  const { t, language } = useTranslation();
  const courses = useExamStore((s) => s.courses);
  const addCourse = useExamStore((s) => s.addCourse);
  const upsertQuestions = useExamStore((s) => s.upsertQuestions);
  const questions = useExamStore((s) => s.questions);
  const yearsForCourse = useExamStore((s) => s.yearsForCourse);
  const removeCourse = useExamStore((s) => s.removeCourse);
  const removeExamSet = useExamStore((s) => s.removeExamSet);

  const [mainTab, setMainTab] = React.useState("import");
  const [editingSet, setEditingSet] = React.useState<{ courseId: string; year: number } | null>(null);
  const [type, setType] = React.useState<ImportType>("questions");
  const [format, setFormat] = React.useState<Format>("json");
  const [text, setText] = React.useState("");
  const [preview, setPreview] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [textCourse, setTextCourse] = React.useState("My Course");
  const [textSet, setTextSet] = React.useState("1");
  const [textContent, setTextContent] = React.useState("");
  const [textPreview, setTextPreview] = React.useState<any>(null);
  const [textError, setTextError] = React.useState<string | null>(null);

  const sampleText = type === "key" ? SAMPLE_KEY_JSON : SAMPLE_Q_JSON;

  // Deep link: /import?tab=manage&course=<id>&set=<year>
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "manage") {
      setMainTab("manage");
      const courseId = params.get("course");
      const set = params.get("set");
      if (courseId && set) {
        setEditingSet({ courseId, year: Number(set) });
      }
    }
  }, []);

  React.useEffect(() => {
    setError(null);
    if (!text.trim() || mainTab !== "import") {
      setPreview(null);
      return;
    }
    try {
      if (type === "key") {
        const parsed = format === "json" ? parseAnswerKeyJSON(text) : parseAnswerKeyCSV(text);
        setPreview({ kind: "key", data: parsed });
      } else {
        const parsed = format === "json" ? parseQuestionsJSON(text) : parseQuestionsCSV(text);
        setPreview({ kind: "questions", data: parsed });
      }
    } catch (e: any) {
      setPreview(null);
      setError(e.message);
    }
  }, [text, type, format, mainTab]);

  React.useEffect(() => {
    setTextError(null);
    if (!textContent.trim() || mainTab !== "text") {
      setTextPreview(null);
      return;
    }
    try {
      const parsed = parseQuestionsText(textContent, {
        course: textCourse,
        year: Number(textSet) || 1,
      });
      setTextPreview(parsed);
    } catch (e: any) {
      setTextPreview(null);
      setTextError(e.message);
    }
  }, [textContent, textCourse, textSet, mainTab]);

  const handleFile = (content: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "txt") {
      setMainTab("text");
      setTextContent(content);
    } else {
      if (ext === "json") setFormat("json");
      else if (ext === "csv") setFormat("csv");
      setText(content);
      setMainTab("import");
    }
    toast.success(t("library.fileLoaded", { name }));
  };

  const importQuestionsData = (parsed: { year: number; course: string; questions: any[] }) => {
    const { course, created } = resolveCourse(parsed.course, courses);
    if (created) addCourse(course);
    const qs = importToQuestions(
      { year: parsed.year, course: parsed.course, questions: parsed.questions },
      course.id
    );
    upsertQuestions(qs);
    toast.success(t("library.importSuccess", { count: qs.length }), {
      description: t("library.importSuccessDesc", { course: course.name, set: parsed.year }),
    });
  };

  const handleImport = () => {
    if (!preview) return;
    try {
      if (preview.kind === "key") {
        const keyObj = format === "json" ? parseAnswerKeyJSON(text) : parseAnswerKeyCSV(text);
        const { course } = resolveCourse(keyObj.course, courses);
        const matching = Object.values(questions).filter(
          (q) => q.courseId === course.id && q.year === keyObj.year
        );
        if (!matching.length) {
          toast.error(t("library.noMatchingQuestions"), {
            description: t("library.noMatchingDesc"),
          });
          return;
        }
        const result = applyAnswerKey(keyObj, matching);
        upsertQuestions(matching);
        toast.success(t("library.keySuccess", { count: result.updated }), {
          description: result.missing
            ? t("library.keyUnmatched", { count: result.missing })
            : undefined,
        });
      } else {
        importQuestionsData(preview.data);
        setText("");
        setPreview(null);
      }
    } catch (e: any) {
      toast.error(t("library.importFailed"), { description: e.message });
    }
  };

  const handleTextImport = () => {
    if (!textPreview) return;
    try {
      importQuestionsData(textPreview);
      setTextContent("");
      setTextPreview(null);
    } catch (e: any) {
      toast.error(t("library.importFailed"), { description: e.message });
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t("library.title")}
        description={t("library.description")}
        icon={Upload}
      />

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import" className="gap-1.5 text-xs sm:text-sm">
            <FileJson className="size-3.5" /> {t("library.tabImport")}
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="size-3.5" /> {t("library.tabText")}
          </TabsTrigger>
          <TabsTrigger value="write" className="gap-1.5 text-xs sm:text-sm">
            <PenLine className="size-3.5" /> {t("library.tabWrite")}
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-1.5 text-xs sm:text-sm">
            <FolderOpen className="size-3.5" /> {t("library.tabManage")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <TypeCard
              active={type === "questions"}
              onClick={() => setType("questions")}
              icon={FileText}
              title={t("library.questions")}
              description={t("library.questionsDesc")}
            />
            <TypeCard
              active={type === "key"}
              onClick={() => setType("key")}
              icon={KeyRound}
              title={t("library.answerKey")}
              description={t("library.answerKeyDesc")}
            />
          </div>
          <ImportPanel
            format={format}
            setFormat={setFormat}
            text={text}
            setText={setText}
            sampleText={sampleText}
            type={type}
            error={error}
            preview={preview}
            dragOver={dragOver}
            setDragOver={setDragOver}
            fileInputRef={fileInputRef}
            onFile={(f: File) => {
              const reader = new FileReader();
              reader.onload = () => handleFile(String(reader.result ?? ""), f.name);
              reader.onerror = () => toast.error(t("library.fileFailed"));
              reader.readAsText(f);
            }}
            onImport={handleImport}
            t={t}
            language={language}
          />
        </TabsContent>

        <TabsContent value="text">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="font-semibold">{t("library.textTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("library.textDesc")}</p>
                <pre className="mt-2 rounded-lg bg-muted/50 p-3 text-xs">{t("library.textFormat")}</pre>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">{t("library.textCourse")}</label>
                  <Input value={textCourse} onChange={(e) => setTextCourse(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">{t("library.textSet")}</label>
                  <Input value={textSet} onChange={(e) => setTextSet(e.target.value)} />
                </div>
              </div>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={SAMPLE_TEXT}
                className="min-h-[240px] font-mono text-xs"
              />
              {textError && (
                <p className="text-xs text-rose-500">{textError}</p>
              )}
              {textPreview && (
                <p className="text-xs text-emerald-600">
                  {t("library.readyImport", {
                    count: textPreview.questions.length,
                    kind: t("library.questions").toLowerCase(),
                    course: textPreview.course,
                    set: textPreview.year,
                  })}
                </p>
              )}
              <Button variant="gradient" disabled={!textPreview} onClick={handleTextImport}>
                {t("library.importQuestions")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="write">
          <Card>
            <CardContent className="p-5">
              <QuestionEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          {editingSet && courses.find((c) => c.id === editingSet.courseId) ? (
            <Card>
              <CardContent className="p-5">
                <ExamSetEditor
                  course={courses.find((c) => c.id === editingSet.courseId)!}
                  year={editingSet.year}
                  onBack={() => setEditingSet(null)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5">
                <SectionTitle title={t("library.manageTitle")} />
                <p className="mb-4 text-sm text-muted-foreground">{t("library.manageDesc")}</p>
                {courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("library.noCourses")}</p>
                ) : (
                  <div className="space-y-3">
                    {courses.map((c) => {
                      const sets = yearsForCourse(c.id);
                      return (
                        <div key={c.id} className="rounded-xl border border-border/60 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{c.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-500"
                              onClick={() => {
                                if (confirm(t("library.deleteCourseConfirm"))) {
                                  removeCourse(c.id);
                                  toast.success(t("library.courseDeleted"));
                                }
                              }}
                            >
                              <Trash2 className="size-4" /> {t("library.deleteCourse")}
                            </Button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sets.map((set) => {
                              const count = Object.values(questions).filter(
                                (q) => q.courseId === c.id && q.year === set
                              ).length;
                              return (
                                <div
                                  key={set}
                                  className="flex items-center gap-1 rounded-full border border-border/60 bg-card py-1 pe-1 ps-3 text-xs"
                                >
                                  <button
                                    type="button"
                                    className="flex items-center gap-1.5 font-medium hover:text-primary"
                                    onClick={() => setEditingSet({ courseId: c.id, year: set })}
                                  >
                                    <Pencil className="size-3" />
                                    {t("common.examSet")} {formatLocalizedNumber(set, language)} ·{" "}
                                    {formatLocalizedNumber(count, language)} {t("common.questions")}
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full p-1 text-rose-500 hover:bg-rose-500/10"
                                    onClick={() => {
                                      if (confirm(t("library.deleteSetConfirm"))) {
                                        removeExamSet(c.id, set);
                                        toast.success(t("library.setDeleted"));
                                      }
                                    }}
                                    title={t("library.deleteSet")}
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImportPanel({
  format,
  setFormat,
  text,
  setText,
  sampleText,
  type,
  error,
  preview,
  dragOver,
  setDragOver,
  fileInputRef,
  onFile,
  onImport,
  t,
  language,
}: any) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Tabs value={format} onValueChange={(v) => setFormat(v as Format)}>
              <TabsList>
                <TabsTrigger value="json"><FileJson className="size-3.5" /> JSON</TabsTrigger>
                <TabsTrigger value="csv"><FileSpreadsheet className="size-3.5" /> CSV</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setText(sampleText)}>
                <Sparkles className="size-3.5" /> {t("common.sample")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setText("")}>
                {t("common.clear")}
              </Button>
            </div>
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "mb-3 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed py-5",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <Upload className="size-5 text-muted-foreground" />
            <p className="mt-1.5 text-xs text-muted-foreground">{t("library.dropFile")}</p>
            <input ref={fileInputRef} type="file" accept=".json,.csv,.txt" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[260px] font-mono text-xs"
            placeholder={t("library.pastePlaceholder", {
              type: type === "key" ? t("library.answerKey") : t("library.questions"),
              format: format.toUpperCase(),
            })}
          />
          {error && (
            <p className="mt-2 text-xs text-rose-500">{t("library.parseError")} {error}</p>
          )}
          {preview && (
            <p className="mt-2 text-xs text-emerald-600">
              {t("library.readyImport", {
                count: preview.kind === "key" ? preview.data.questions.length : preview.data.questions.length,
                kind: preview.kind === "key" ? t("library.answerEntries") : t("library.questions").toLowerCase(),
                course: preview.data.course,
                set: preview.data.year,
              })}
            </p>
          )}
          <Button variant="gradient" className="mt-4 w-full gap-2" disabled={!preview} onClick={onImport}>
            <Download className="size-4" />
            {type === "key" ? t("library.importKey") : t("library.importQuestions")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <SectionTitle title={t("library.schema")} />
          <p className="text-xs text-muted-foreground">
            {type === "key" ? t("library.schemaKey") : t("library.schemaQuestions")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TypeCard({ active, onClick, icon: Icon, title, description }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border-2 p-4 text-left",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      )}
    >
      <div className={cn("flex size-10 items-center justify-center rounded-xl", active ? "bg-primary/15 text-primary" : "bg-muted")}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </motion.button>
  );
}
