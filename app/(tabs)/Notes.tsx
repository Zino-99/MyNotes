// Import des hooks React
import { useState, useEffect } from 'react';
// Import des composants React Native
import { 
  View,          // Conteneur de base
  Text,          // Affichage de texte
  FlatList,      // Liste performante
  TouchableOpacity, // Bouton cliquable
  StyleSheet,    // Style CSS-in-JS
  Alert,         // Alertes système
  Modal,         // Fenêtre modale
  Pressable      // Bouton pressable
} from 'react-native';
// Import du stockage local
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import de la navigation
import { useNavigation } from '@react-navigation/native';
// Import des icônes
import { Ionicons } from '@expo/vector-icons';

// Interface TypeScript pour les notes
interface Note {
  id: string;                   // Identifiant unique
  title: string;                // Titre de la note
  content: string;              // Contenu textuel
  importance: 'high' | 'medium' | 'low';  // Niveau d'importance
  createdAt: string;            // Date de création
}

// Composant principal de l'écran des notes
export default function NotesScreen() {
  // Initialisation de la navigation
  const navigation = useNavigation();
  
  // États du composant
  const [notes, setNotes] = useState<Note[]>([]);         // Liste des notes
  const [refreshing, setRefreshing] = useState(false);    // État de rafraîchissement
  const [modalVisible, setModalVisible] = useState(false); // Visibilité modale
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null); // Note à supprimer

  // Fonction de chargement des notes
  const loadNotes = async () => {
    setRefreshing(true); // Active l'indicateur de rafraîchissement
    try {
      const savedNotes = await AsyncStorage.getItem('notes');
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes) as Note[];
        setNotes(parsedNotes);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setRefreshing(false); // Désactive l'indicateur
    }
  };

  // Effet pour charger les notes au focus de l'écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadNotes);
    loadNotes(); // Charge immédiatement
    return unsubscribe; // Nettoyage
  }, [navigation]);

  // Confirmation de suppression
  const confirmDelete = (noteId: string) => {
    setNoteToDelete(noteId);
    setModalVisible(true);
  };

  // Suppression effective d'une note
  const handleDelete = async () => {
    if (!noteToDelete) return;
    
    try {
      const newNotes = notes.filter(note => note.id !== noteToDelete);
      await AsyncStorage.setItem('notes', JSON.stringify(newNotes));
      setNotes(newNotes);
      setModalVisible(false);
    } catch (error) {
      console.error("Error deleting note:", error);
      Alert.alert("Error", "Failed to delete note");
      setModalVisible(false);
    }
  };

  // Rendu d'un élément de note
  const renderNote = ({ item }: { item: Note }) => (
    <View style={styles.note}>
      {/* En-tête avec titre et date */}
      <View style={styles.noteHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('en-US')}
        </Text>
      </View>

      {/* Contenu de la note */}
      <Text style={styles.content} numberOfLines={3} ellipsizeMode="tail">
        {item.content}
      </Text>

      {/* Pied de note avec importance et actions */}
      <View style={styles.footer}>
        {/* Badge d'importance coloré */}
        <Text style={[
          styles.importance,
          {
            color: item.importance === 'high' ? '#F45B69' :
                  item.importance === 'medium' ? '#5EE4EC' : '#7EE4EC'
          }
        ]}>
          {item.importance === 'high' ? 'High' : 
           item.importance === 'medium' ? 'Medium' : 'Low'}
        </Text>

        {/* Boutons d'action */}
        <View style={styles.actions}>
          {/* Bouton d'édition */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Form', { note: JSON.stringify(item) })}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={20} color="#114B5F" />
          </TouchableOpacity>

          {/* Bouton de suppression */}
          <TouchableOpacity
            onPress={() => confirmDelete(item.id)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#F45B69" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Rendu principal
  return (
    <View style={styles.container}>
      {/* En-tête personnalisé */}
      <View style={styles.header}>
        {/* Bouton retour */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('index')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#114B5F" />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
        
        {/* Bouton d'ajout */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Form', { note: null })}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#114B5F" />
        </TouchableOpacity>
      </View>

      {/* Modal de confirmation de suppression */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Are you sure you want to delete this note?</Text>
            <View style={styles.modalButtons}>
              {/* Bouton Annuler */}
              <Pressable
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </Pressable>
              {/* Bouton Supprimer */}
              <Pressable
                style={[styles.button, styles.buttonDelete]}
                onPress={handleDelete}
              >
                <Text style={styles.textStyle}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Liste des notes */}
      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={loadNotes}
        contentContainerStyle={notes.length === 0 ? styles.emptyContainer : null}
        ListEmptyComponent={
          // État vide
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={50} color="#8E8E93" />
            <Text style={styles.emptyText}>No notes yet</Text>
            <TouchableOpacity
              style={styles.addFirstNoteButton}
              onPress={() => navigation.navigate('Form', { note: null })}
            >
              <Text style={styles.addFirstNoteText}>Create your first note</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// Styles CSS-in-JS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#114B5F',
    marginLeft: 5,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  addButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  note: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'Montserrat_600SemiBold',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Montserrat_400Regular',
  },
  content: {
    color: '#666',
    fontSize: 14,
    marginBottom: 15,
    fontFamily: 'Montserrat_400Regular',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 10,
  },
  importance: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Montserrat_500Medium',
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    padding: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    color: '#8E8E93',
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
  addFirstNoteButton: {
    marginTop: 20,
    backgroundColor: '#114B5F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFirstNoteText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#1C1C1E',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 5,
    padding: 10,
    paddingHorizontal: 20,
    elevation: 2,
  },
  buttonCancel: {
    backgroundColor: '#FFD4CA',
  },
  buttonDelete: {
    backgroundColor: '#F45B69',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold',
  },
});