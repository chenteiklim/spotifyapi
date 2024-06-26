import React, { useEffect, useState } from 'react';
import '../styles/Content.css';
import loveIcon from '../assets/love-icon.jpg';

const client_id = "8b1405e54ac0484284dcf9813a6ffb65";
const redirect_uri = "http://localhost:3000/content";
const scope = "user-read-private user-read-email user-top-read";

function extractTokenFromURI() {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    console.log("Complete authorize");
    return token;
  }
  return null;
}

const Content = () => {
  const [token, setToken] = useState(null);
  const [newReleases, setNewReleases] = useState([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveToFavorites = async (imageURL,songTitle, artist, spotifyUrl) => {
    const email = sessionStorage.getItem('email');

    if (!email) {
      console.error('User email not found in sessionStorage.');
      return;
    }
    console.log('Logged-in user email:', email); // Log the email from sessionStorage

    try {
      const response = await fetch('http://localhost:8000/save-favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageURL,
          email,
          songTitle,
          artist,
          spotifyUrl,
        }),
      });

      const data = await response.json();
      console.log(data); // Log the response from the backend
    } catch (error) {
      console.error('Error saving to favorites:', error);
    }
  }
  const handleDeleteFavorites = async (image, title, subtitle, href) => {
    const email = sessionStorage.getItem('email');
  
    if (!email) {
      console.error('User email not found in sessionStorage.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:8000/delete-favorite', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          songTitle: title,
          artist: subtitle,
          spotifyUrl: href,
          imageURL: image,
        }),
      });
  
      const data = await response.json();
      console.log(data); // Log the response from the backend
      // Update the favorites list in the frontend after successful deletion
      fetchFavorites(); // Assuming fetchFavorites is a function to fetch updated favorites
    } catch (error) {
      console.error('Error deleting favorite:', error);
    }
  }

  const fetchNewReleases = async (TOKEN) => {
    try {
      const endpoint = 'https://api.spotify.com/v1/browse/new-releases';
      const response = await fetch(endpoint + "?limit=6", {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + TOKEN,
        },
      });
      const data = await response.json();
      setNewReleases(data.albums.items);
    } catch (error) {
      alert('Something went wrong fetching new releases.');
      console.log(error);
    }
  };

  const fetchFeaturedPlaylists = async (TOKEN) => {
    try {
      const endpoint = 'https://api.spotify.com/v1/browse/featured-playlists';
      const response = await fetch(endpoint + "?limit=6", {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + TOKEN,
        },
      });
      const data = await response.json();
      setFeaturedPlaylists(data.playlists.items);
    } catch (error) {
      alert('Something went wrong fetching featured playlists.');
      console.log(error);
    }
  };

  const fetchRecommendations = async (TOKEN, genres) => {
    try {
      const endpoint = 'https://api.spotify.com/v1/recommendations';
      const response = await fetch(endpoint + `?limit=6&seed_genres=${genres.join(",")}`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + TOKEN,
        },
      });
      const data = await response.json();
      console.log(data); // Log the data received from the API
      setRecommendations(data.tracks);
    } catch (error) {
      alert('Something went wrong fetching recommendations.');
      console.log(error);
    }
  };

  const fetchFavorites = async () => {
    const email = sessionStorage.getItem('email');

    if (!email) {
      console.error('User email not found in sessionStorage.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/favorites?email=${email}`);
      const data = await response.json();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Error fetching favorite songs:', error);
    }
  };

  useEffect(() => {
    const TOKEN = extractTokenFromURI();
    if (TOKEN) {
      setToken(TOKEN);
      fetchNewReleases(TOKEN);
      fetchFeaturedPlaylists(TOKEN);
      fetchRecommendations(TOKEN, ["alternative", "samba"]); // Pass the genre seeds here
      fetchFavorites();
    } else {
      window.open(getAuthorizeUrl(), "_self");
    }
  }, []);

  const getAuthorizeUrl = () => {
    let url = "https://accounts.spotify.com/authorize";
    url += "?response_type=token";
    url += "&client_id=" + encodeURIComponent(client_id);
    url += "&scope=" + encodeURIComponent(scope);
    url += "&redirect_uri=" + encodeURIComponent(redirect_uri);
    return url;
  };

  const generateCard = (image, title, subtitle, href) => (
    <div className="card">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <img src={image} alt="an image" />
        <div className="title">{title}</div>
        <div className="subtitle">{subtitle}</div>
      </a>
      <button className='button' onClick={() => handleSaveToFavorites(image,title, subtitle, href)}>Add to Favorites</button>
      <button className='button' onClick={() => handleDeleteFavorites(image,title, subtitle, href)}>Delete Favorites</button>

    </div>
  );

  return (
    <main id="content">
      <section id="new-releases">
        <h1 className="title">New Releases</h1>
        <h3 className="subtitle">New releases from Spotify</h3>
        <div className="card-wrapper">
          {newReleases.map((track, index) => (
            <React.Fragment key={index}>
              {generateCard(track.images[1].url, track.name, track.artists[0].name, track.external_urls.spotify)}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section id="featured-playlists">
        <h1 className="title">Featured Playlists</h1>
        <h3 className="subtitle">Featured playlists from Spotify</h3>
        <div className="card-wrapper">
          {featuredPlaylists.map((playlist, index) => (
            <React.Fragment key={index}>
              {generateCard(playlist.images[0].url, playlist.name, playlist.description, playlist.external_urls.spotify)}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section id="recommendations">
        <h1 className="title">Recommendations</h1>
        <h3 className="subtitle">Your personalized recommendations on Spotify</h3>
        <div className="card-wrapper">
          {recommendations && recommendations.length > 0 ? (
            recommendations.map((track, index) => (
              <React.Fragment key={index}>
                {generateCard(track.album.images[0].url, track.name, track.artists[0].name, track.external_urls.spotify)}
              </React.Fragment>
            ))
          ) : (
            <p>No recommendations available</p>
          )}
        </div>
      </section>

      <section id="favorites">
        <h1 className="title">Favorites</h1>
        <h3 className="subtitle">Your saved favorite songs</h3>
        <div className="card-wrapper">
          {favorites.map((favorite, index) => (
            <React.Fragment key={index}>
              {generateCard(favorite.imageURL,favorite.songTitle, favorite.artist, favorite.spotifyUrl)}
            </React.Fragment>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Content;