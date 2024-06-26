const Song = require("../models/song");
const axios = require("axios");
const getSpotifyAccessToken = require("../middlewares/configSpotify");

//Cargar de canciones Spotify
exports.getTracks= async (req, res) => {
  try {
    const accessToken = await getSpotifyAccessToken();
    let tracks = [];
    let nextUrl = `https://api.spotify.com/v1/search?q=track&type=track&limit=50`;

    while (tracks.length < 500 && nextUrl) {
      const response = await axios.get(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const newTracks = response.data.tracks.items.map((track) => ({
        name: track.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        releaseDate: track.album.release_date,
        imageUrl: track.album.images[0]?.url,
        comments: [],
        geolocation: {
          type: "Point",
          coordinates: [0, 0],
        },
      }));

      tracks = tracks.concat(newTracks);

      nextUrl = response.data.tracks.next;
    }

    tracks = tracks.slice(0, 500);

    await Song.insertMany(tracks);

    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las pistas" });
  }
};

exports.getTracksSpotify = async (req, res) => {
  try {
    const accessToken = await getSpotifyAccessToken();
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    // Buscar pistas en Spotify
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: query,
        type: "track",
        limit: 50,
      },
    });

    const tracks = response.data.tracks.items.map((track) => ({
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      releaseDate: track.album.release_date,
      imageUrl: track.album.images[0]?.url,
    }));

    const savedTracks = [];
    for (const track of tracks) {
      const existingTrack = await Song.findOne({ name: track.name, artist: track.artist });
      if (!existingTrack) {
        const newTrack = new Song(track);
        await newTrack.save();
        savedTracks.push(newTrack);
      }
    }
    const searchResults = await Song.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { artist: { $regex: query, $options: 'i' } }
      ]
    });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener y guardar las pistas" });
  }
};


// Buscar canciones
exports.searchSongs = async (req, res) => {
  try {
    const { name, artist, date } = req.query;
    const query = {};
    if (name) query.name = new RegExp(name, "i");
    if (artist) query.artist = new RegExp(artist, "i");
    if (date) query.releaseDate = new Date(date);
    const songs = await Song.find(query);
    res.status(200).send(songs);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Obtener datos de una canción
exports.getSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate("comments.author");
    if (!song) {
      return res.status(404).send({ message: "Canción no encontrada" });
    }
    res.status(200).send(song);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Añadir comentario a una canción
exports.addComment = async (req, res) => {
  try {
    const { text, stars, author } = req.body;
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).send({ message: "Canción no encontrada" });
    }
    const comment = {
      author,
      text,
      stars,
      createdAt: new Date(),
      geolocation: { type: "Point", coordinates: [req.body.geolocation.coordinates[0], req.body.geolocation.coordinates[1]] },
    };
    song.comments.push(comment);
    await song.save();
    res.status(201).send(song);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Insertar canciones seleccionando como favoritos
exports.addFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).send({ message: "Usuario no encontrado" });
    }
    user.favorites.push(req.params.id);
    await user.save();
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};



exports.addSong = async (req, res) => {
  try {
    const { name, artist, imageUrl, lat, lng } = req.body;
    const currentDate = new Date(); // Obtiene la fecha y hora actuales

    const song = new Song({
      name,
      artist,
      releaseDate: currentDate,
      imageUrl,
      geolocation: { type: "Point", coordinates: [lng, lat] },
    });

    await song.save();
    res.status(201).send(song);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
};

  // Editar canción
  exports.updateSong = async (req, res) => {
    try {
      const { name, artist, imageUrl, lat, lng } = req.body;
      const updatedSong = await Song.findByIdAndUpdate(
        req.params.id,
        {
          name,
          artist,
          releaseDate: new Date(),
          imageUrl,
          geolocation: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
        { new: true }
      );
  
      if (!updatedSong) {
        return res.status(404).send({ message: 'Canción no encontrada' });
      }
  
      res.status(200).send(updatedSong);
    } catch (error) {
      console.error('Error al actualizar la canción:', error);
      res.status(500).send({ message: 'Error al actualizar la canción' });
    }
  };


// Eliminar canción
exports.deleteSong = async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).send({ message: "Canción no encontrada" });
    }
    res.status(204).send({ message: "Canción eliminada correctamente" });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const song = await Song.findById(req.params.songId);
    if (!song) {
      return res.status(404).send({ message: "Canción no encontrada" });
    }
    const comment = song.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).send({ message: "Comentario no encontrado" });
    }
    comment.deleteOne();
    await song.save();

    const updatedSong = await Song.findById(req.params.songId); 
    res.status(200).send({ message: "Comentario eliminado con éxito", song: updatedSong });

  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    if (error.name === 'CastError') {
      res.status(400).send({ message: "ID de canción o comentario inválido" });
    } else {
      res.status(500).send({ message: "Error interno del servidor" });
    }
  }
};
