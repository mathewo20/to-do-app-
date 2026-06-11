import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { loadTasks } from '../firebaseUtils';
import { Task } from '../types';
import TaskFormScreen from './TaskFormScreen';

export default function TaskListScreen({ user, onLogout }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const refreshTasks = async () => {
    if (!user) return;
    const loaded = await loadTasks(user.uid);
    setTasks(loaded);
  };

  useEffect(() => {
    refreshTasks();
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Button title="Logout" onPress={onLogout} />
      </View>
      <Button
        title="New Task"
        onPress={() => {
          setSelectedTask(null);
          setTaskFormOpen(true);
        }}
      />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => {
              setSelectedTask(item);
              setTaskFormOpen(true);
            }}
          >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskMeta}>{item.categoryId} • {new Date(item.dueAtUtc).toLocaleString()}</Text>
            <Text style={styles.taskStatus}>{item.status}</Text>
          </TouchableOpacity>
        )}
      />
      {taskFormOpen && (
        <TaskFormScreen
          user={user}
          task={selectedTask}
          onClose={() => {
            setTaskFormOpen(false);
            refreshTasks();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  taskCard: { padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginVertical: 8 },
  taskTitle: { fontSize: 18, fontWeight: '600' },
  taskMeta: { marginTop: 4, color: '#555' },
  taskStatus: { marginTop: 4, color: '#888' },
});
