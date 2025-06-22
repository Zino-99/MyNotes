// Import des hooks React
import { useState, useEffect } from 'react';
// Import des composants React Native
import { 
  View,           // Conteneur de base
  TextInput,      // Champ de saisie
  StyleSheet,     // Style CSS-in-JS
  TouchableOpacity, // Bouton cliquable
  Alert,          // Alertes système
  ScrollView,     // Zone défilable
  Modal           // Fenêtre modale
} from 'react-native';
// Import du composant Text personnalisé
import { Text } from '@/components/Themed';
// Import des outils de navigation
import { router, useLocalSearchParams } from 'expo-router';
// Import du stockage local
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import des icônes
import { Ionicons } from '@expo/vector-icons';

// Interface TypeScript pour les notes
interface Note {
  id: string;                   // Identifiant unique
  title: string;                // Titre de la note
  content: string;              // Contenu textuel
  importance: 'low' | 'medium' | 'high';  // Niveau d'importance
  createdAt: string;            // Date de création
}

// Couleurs associées aux niveaux d'importance
const ImportanceColors = {
  high: '#F45B69',    // Rouge pour haute importance
  medium: '#114B5F',  // Bleu foncé pour importance moyenne
  low: '#7EE4EC',     // Bleu clair pour faible importance
  default: '#E5E5EA', // Gris par défaut
};

// Composant principal du formulaire
export default function Form() {
  // Récupération des paramètres de navigation
  const params = useLocalSearchParams();
  
  // États du composant
  const [title, setTitle] = useState('');         // Titre de la note
  const [content, setContent] = useState('');     // Contenu de la note
  const [importance, setImportance] = useState<'low' | 'medium' | 'high'>('medium'); // Niveau d'importance
  const [editingNote, setEditingNote] = useState<Note | null>(null); // Note en cours d'édition
  const [showSuccess, setShowSuccess] = useState(false); // Affichage du succès

  // Effet pour initialiser le formulaire si on édite une note
  useEffect(() => {
    if (params.note) {
      try {
        const note = JSON.parse(params.note as string);
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        setImportance(note.importance || 'medium');
      } catch (error) {
        console.error('Failed to parse note', error);
      }
    }
  }, [params.note]);

  // Gestion de la sauvegarde de la note
  const handleSave = async () => {
    // Validation du titre
    if (!title.trim()) {
      Alert.alert('Error', 'A title is required');
      return;
    }

    try {
      // Création de l'objet note
      const newNote: Note = {
        id: editingNote?.id || Date.now().toString(), // Garde l'ID existant ou en crée un nouveau
        title,
        content,
        importance,
        createdAt: editingNote?.createdAt || new Date().toISOString(), // Garde la date existante ou en crée une nouvelle
      };

      // Récupération des notes existantes
      const savedNotes = await AsyncStorage.getItem('notes');
      let notes = savedNotes ? JSON.parse(savedNotes) : [];

      // Mise à jour ou ajout de la note
      if (editingNote) {
        notes = notes.map((note: Note) => 
          note.id === editingNote.id ? newNote : note
        );
      } else {
        notes.push(newNote);
      }

      // Sauvegarde dans AsyncStorage
      await AsyncStorage.setItem('notes', JSON.stringify(notes));
      setShowSuccess(true); // Affiche le message de succès
      
      // Retour après 1.5s
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 1500);

    } catch (error) {
      Alert.alert('Error', 'Failed to save');
      console.error(error);
    }
  };

  // Composant de bouton d'importance
  const ImportanceButton = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
    const isActive = importance === level;
    return (
      <TouchableOpacity
        style={[
          styles.importanceOption,
          { 
            backgroundColor: isActive ? ImportanceColors[level] : ImportanceColors.default,
            borderColor: ImportanceColors[level],
          }
        ]}
        onPress={() => setImportance(level)}
      >
        {/* Icône dynamique selon l'importance */}
        <Ionicons 
          name={
            level === 'high' ? 'alert-circle' :
            level === 'medium' ? 'warning' : 'checkmark-circle'
          } 
          size={20} 
          color={isActive ? 'white' : ImportanceColors[level]} 
        />
        {/* Texte dynamique */}
        <Text style={[
          styles.importanceText,
          { color: isActive ? 'white' : ImportanceColors[level] }
        ]}>
          {level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low'}
        </Text>
      </TouchableOpacity>
    );
  };

  // Rendu principal
  return (
    <>
      {/* Zone défilable pour le formulaire */}
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled" // Gestion du clavier
      >
        {/* Titre du formulaire */}
        <Text style={styles.header}>
          {editingNote ? 'Edit the note' : 'New note'}
        </Text>

        {/* Champ Titre */}
        <Text style={styles.label}>Title*</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Title of the note"
          placeholderTextColor="#8E8E93"
          returnKeyType="next"
        />

        {/* Champ Contenu */}
        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={content}
          onChangeText={setContent}
          placeholder="Write your note here..."
          placeholderTextColor="#8E8E93"
          multiline
          textAlignVertical="top"
        />

        {/* Sélecteur d'importance */}
        <Text style={styles.label}>Importance</Text>
        <View style={styles.importanceContainer}>
          <ImportanceButton level="high" />
          <ImportanceButton level="medium" />
          <ImportanceButton level="low" />
        </View>

        {/* Boutons d'action */}
        <View style={styles.buttonContainer}>
          {/* Bouton Annuler */}
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: '#FFD4CA' }]} 
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {/* Bouton Sauvegarder */}
          <TouchableOpacity 
            style={[
              styles.saveButton,
              { 
                backgroundColor: !title.trim() ? '#C7C7CC' : '#114B5F',
              }
            ]} 
            onPress={handleSave}
            disabled={!title.trim()}
          >
            <Text style={styles.saveButtonText}>
              <Ionicons name="save" size={18} color="white" /> Save
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de succès */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={48} color="#34C759" />
            <Text style={styles.modalText}>Note saved!</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Styles CSS-in-JS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Espace pour le clavier
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    color: '#1C1C1E',
    fontFamily: 'Montserrat_600SemiBold',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#1C1C1E',
    fontFamily: 'Montserrat_500Medium',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: 'Montserrat_400Regular',
  },
  multilineInput: {
    minHeight: 150, // Hauteur minimale pour le contenu
    textAlignVertical: 'top', // Alignement du texte en haut
  },
  importanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10, // Espace entre les boutons
  },
  importanceOption: {
    flex: 1, // Prend tout l'espace disponible
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // Espace entre icône et texte
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  importanceText: {
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15, // Espace entre les boutons
    marginTop: 10,
  },
  saveButton: {
    flex: 1, // Partage l'espace équitablement
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Fond semi-transparent
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%', // Largeur relative
  },
  modalText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#1C1C1E',
    fontFamily: 'Montserrat_500Medium',
  },
});