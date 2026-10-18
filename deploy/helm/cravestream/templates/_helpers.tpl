{{/* Common labels on every object */}}
{{- define "cravestream.labels" -}}
app.kubernetes.io/part-of: cravestream
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
environment: {{ .Values.global.environment }}
{{- end }}

{{/* Selector labels for one component: include "cravestream.selector" (dict "component" "api") */}}
{{- define "cravestream.selector" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/part-of: cravestream
{{- end }}

{{/* Pod-level security settings that satisfy the "restricted" Pod Security Standard */}}
{{- define "cravestream.podSecurity" -}}
runAsNonRoot: true
runAsUser: {{ .uid }}
runAsGroup: {{ .uid }}
fsGroup: {{ .uid }}
seccompProfile:
  type: RuntimeDefault
{{- end }}

{{/* Container-level security settings */}}
{{- define "cravestream.containerSecurity" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: {{ .readOnly }}
capabilities:
  drop: ["ALL"]
{{- end }}

{{- define "cravestream.image" -}}
{{ .root.Values.image.registry }}/{{ .img.repository }}:{{ .img.tag }}
{{- end }}
