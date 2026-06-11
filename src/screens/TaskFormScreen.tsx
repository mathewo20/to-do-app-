import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { createTask, updateTask, getUserCategories } from '../firebaseUtils';
import { requestNotificationPermission, scheduleNotification, cancelNotifications, buildNotificationSchedule } from '../notifications';
import { Category, Task } from '../types';

const categoriesMap: Record<string, string> = {
  'non-urgent': 'Non-urgent',
  'little-urgent': 'Little urgent',
  urgent: 'Urgent',
  'extremely-urgent': 'Extremely urgent',
};

export default function TaskFormScreen({ user, task, onClose }: any) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDateText, setDueDateText] = useState(task?.dueAtUtc ?? new Date().toISOString());
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? 'non-urgent');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const load = async () => {
      const cats = await getUserCategories(user.uid);
      setCategories(cats.length ? cats : []);
    };
    load();
  }, [user.uid]);

  const saveTask = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title.');
      return;
    }

    const dueAtUtc = new Date(dueDateText).toISOString();
    if (isNaN(new Date(dueAtUtc).getTime())) {
      Alert.alert('Invalid due date', 'Please enter a valid UTC ISO date like 2026-06-11T15:30:00Z.');
      return;
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const template = deriveTemplate(categoryId);
    const schedule = buildNotificationSchedule(dueAtUtc, timezone, template);

    const canNotify = (await requestNotificationPermission()).granted;
    if (!task) {
      const createdId = await createTask(user.uid, {
        title,
        description,
        dueAtUtc,
        timezone,
        categoryId,
        status: 'pending',
      } as any);
      task = {
        id: createdId,
        title,
        description,
        dueAtUtc,
        timezone,
        categoryId,
        status: 'pending',
        createdAt: dueAtUtc,
        updatedAt: dueAtUtc,
      } as Task;
    } else {
      if (task.scheduledNotifications?.length) {
        await cancelNotifications(task.scheduledNotifications.map((item) => item.notificationId));
      }
      await updateTask(user.uid, task.id, {
        title,
        description,
        dueAtUtc,
        timezone,
        categoryId,
        status: task.status,
      });
    }

    const notificationIds = canNotify
      ? await Promise.all(
          schedule.map(async (item) => {
            const id = await scheduleNotification(task!.id, title, description || 'Task due soon', item.triggerAtUtc, item.type === 'alarm');
            return { notificationId: id, type: item.type, triggerAtUtc: item.triggerAtUtc.toISOString() };
          })
        )
      : [];

    if (!canNotify) {
      Alert.alert('Notifications disabled', 'The task is saved, but in-app notifications are not scheduled until you allow permission.');
    }

    await updateTask(user.uid, task.id, { scheduledNotifications: notificationIds } as any);
    onClose();
  };

  const deriveTemplate = (categoryId: string) => {
    switch (categoryId) {
      case 'little-urgent':
        return { alarmOffsets: [], notificationOffsets: [15, 0] };
      case 'urgent':
        return { alarmOffsets: [30], notificationOffsets: [5] };
      case 'extremely-urgent':
        return { alarmOffsets: [30, 15], notificationOffsets: [20, 15, 10, 5] };
      default:
        return { alarmOffsets: [], notificationOffsets: [0] };
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{task ? 'Edit Task' : 'New Task'}</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text style={styles.label}>Due date/time (UTC ISO)</Text>
      <TextInput
        style={styles.input}
        placeholder="2026-06-11T15:30:00Z"
        value={dueDateText}
        onChangeText={setDueDateText}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Urgency</Text>
      {Object.entries(categoriesMap).map(([id, name]) => (
        <TouchableOpacity key={id} onPress={() => setCategoryId(id)} style={styles.optionRow}>
          <Text style={[styles.optionText, categoryId === id && styles.optionSelected]}>{name}</Text>
        </TouchableOpacity>
      ))}
      <Button title={task ? 'Update Task' : 'Create Task'} onPress={saveTask} />
      <Button title="Cancel" onPress={onClose} color="#888" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  dateRow: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  optionRow: { paddingVertical: 10 },
  optionText: { fontSize: 16, color: '#333' },
  optionSelected: { fontWeight: '700', color: '#0066cc' },
});
