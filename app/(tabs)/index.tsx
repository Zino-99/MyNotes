// Import des hooks de React
import { useState, useCallback } from 'react';
// Import des composants React Native
import { 
  View,       // Conteneur de mise en page
  Text,       // Affichage de texte
  StyleSheet, // Pour les styles
  TouchableOpacity, // Bouton cliquable
  ScrollView, // Zone de défilement
  Alert       // Pour les alertes
} from 'react-native';
// Import pour le stockage local
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import des outils de navigation Expo
import { router, useFocusEffect } from 'expo-router';
// Import des icônes
import { Ionicons } from '@expo/vector-icons';

// Interface TypeScript définissant la structure d'une note
interface Note {
  id: string;                   // Identifiant unique
  title: string;                // Titre de la note
  content: string;              // Contenu textuel
  importance: 'low' | 'medium' | 'high';  // Niveau d'importance
  createdAt: string;            // Date de création (string ISO)
}

// Objet définissant les couleurs selon l'importance
const ImportanceColors = {
  high: '#F45B69',    // Rouge pour haute importance
  medium: '#114B5F',  // Bleu foncé pour importance moyenne
  low: '#7EE4EC',     // Bleu clair pour faible importance
};

// Composant principal de l'écran d'accueil
export default function HomeScreen() {
  // State pour stocker la liste des notes
  const [notes, setNotes] = useState<Note[]>([]);

  // Fonction pour charger les notes depuis AsyncStorage
  const loadNotes = useCallback(async () => {
    try {
      // Récupération des notes sauvegardées
      const savedNotes = await AsyncStorage.getItem('notes');
      if (savedNotes) {
        // Conversion du JSON en objet JavaScript
        const parsedNotes = JSON.parse(savedNotes);
        // Tri des notes par date (du plus récent au plus ancien)
        const sortedNotes = parsedNotes.sort((a: Note, b: Note) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        // Mise à jour du state avec les notes triées
        setNotes(sortedNotes);
      }
    } catch (error) {
      // Affichage d'une alerte en cas d'erreur
      Alert.alert('Error', 'Failed to load notes');
      console.error(error);
    }
  }, []); // Aucune dépendance car fonction autonome

  // Recharge les notes quand l'écran obtient le focus
  useFocusEffect(useCallback(() => {
    loadNotes();
  }, [loadNotes])); // Dépendance à loadNotes

  // Gère le clic sur une note
  const handleNotePress = (note: Note) => {
    // Navigation vers l'écran de détail avec la note en paramètre
    router.push({
      pathname: '/Notes',
      params: { note: JSON.stringify(note) }, // Sérialisation de la note
    });
  };

  // Gère l'ajout d'une nouvelle note
  const handleAddNote = () => {
    // Navigation vers l'écran de formulaire
    router.push({
      pathname: '/Form',
      params: { note: null } // null indique une nouvelle note
    });
  };

  // Composant d'affichage d'une carte de note
  const NoteCard = ({ note }: { note: Note }) => (
    // Conteneur cliquable
    <TouchableOpacity 
      style={[
        styles.noteCard, 
        { borderLeftColor: ImportanceColors[note.importance] } // Couleur dynamique
      ]}
      onPress={() => handleNotePress(note)} // Gestion du clic
    >
      {/* En-tête de la note (titre + date) */}
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
        <Text style={styles.noteDate}>
          {/* Formatage de la date */}
          {new Date(note.createdAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </Text>
      </View>
      {/* Affichage conditionnel du contenu */}
      {note.content && (
        <Text style={styles.noteContent} numberOfLines={3}>
          {note.content}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Rendu du composant
  return (
    <View style={styles.container}>
      {/* Zone défilable pour le contenu */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false} // Cache la barre de défilement
      >
        {/* Titre de l'écran */}
        <Text style={styles.header}>My Notes</Text>

        {/* Affichage conditionnel selon qu'il y a des notes ou non */}
        {notes.length === 0 ? (
          // État vide - pas de notes
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>No saved notes</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddNote}
            >
              <Text style={styles.emptyButtonText}>Create First Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Liste des notes existantes
          <View style={styles.notesContainer}>
            {notes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bouton flottant pour ajouter une note */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddNote}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// Styles CSS-in-JS
const styles = StyleSheet.create({
  // Style du conteneur principal
  container: {
    flex: 1,                   // Prend tout l'espace disponible
    backgroundColor: '#F2F2F7', // Couleur de fond
    padding: 16,               // Marge intérieure
  },
  // Style du conteneur défilable
  scrollContainer: {
    flexGrow: 1,              // Permet au contenu de s'étendre
    paddingBottom: 80,        // Espace pour le bouton flottant
  },
  // Style du titre
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 24,
    marginTop: 8,
  },
  // Style de l'état vide
  emptyState: {
    flex: 1,
    justifyContent: 'center', // Centrage vertical
    alignItems: 'center',     // Centrage horizontal
    marginTop: 120,
  },
  // Style du texte d'état vide
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
    fontWeight: '500',
  },
  // Style du bouton d'état vide
  emptyButton: {
    backgroundColor: '#114B5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  // Style du texte du bouton d'état vide
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Style du conteneur des notes
  notesContainer: {
    gap: 16, // Espace entre les cartes
  },
  // Style d'une carte de note
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 6, // Bordure gauche colorée
    shadowColor: '#000', // Ombre pour iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Ombre pour Android
  },
  // Style de l'en-tête de la note
  noteHeader: {
    flexDirection: 'row',      // Alignement horizontal
    justifyContent: 'space-between', // Espacement maximal
    alignItems: 'center',      // Alignement vertical
    marginBottom: 8,
  },
  // Style du titre de la note
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1, // Prend tout l'espace disponible
  },
  // Style de la date de la note
  noteDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 12,
  },
  // Style du contenu de la note
  noteContent: {
    fontSize: 14,
    color: '#636366',
    lineHeight: 20, // Hauteur de ligne
  },
  // Style du bouton flottant
  addButton: {
    position: 'absolute', // Position absolue
    right: 24,           // 24px du bord droit
    bottom: 24,          // 24px du bas
    width: 60,           // Largeur fixe
    height: 60,          // Hauteur fixe
    borderRadius: 30,    // Bord arrondi (cercle)
    backgroundColor: '#114B5F',
    alignItems: 'center',      // Centrage horizontal
    justifyContent: 'center',  // Centrage vertical
    shadowColor: '#000',       // Ombre pour iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,              // Ombre pour Android
  },
});