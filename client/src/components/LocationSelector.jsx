import { useState, useEffect } from 'react';

const LocationSelector = ({ onLocationSelect }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    fetch('/ililce.json')
      .then(response => response.json())
      .then(data => setCities(data))
      .catch(error => console.error('Şehir verisi yüklenemedi:', error));
  }, []);

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    
    const cityData = cities.find(c => c.name === cityName);
    setDistricts(cityData ? cityData.districts : []);
    setSelectedDistrict('');
    
    if (onLocationSelect) {
        onLocationSelect({ city: cityName, district: '' });
    }
  };

  const handleDistrictChange = (e) => {
    const districtName = e.target.value;
    setSelectedDistrict(districtName);

    if (onLocationSelect) {
        onLocationSelect({ city: selectedCity, district: districtName });
    }
  };

  return (
    <div className="flex gap-4">
      <select 
        value={selectedCity} 
        onChange={handleCityChange}
        className="border p-2 rounded"
      >
        <option value="">İl Seçiniz</option>
        {cities.map(city => (
          <option key={city.slug} value={city.name}>{city.name}</option>
        ))}
      </select>
      <select 
        value={selectedDistrict} 
        onChange={handleDistrictChange}
        disabled={!selectedCity}
        className="border p-2 rounded"
      >
        <option value="">İlçe Seçiniz</option>
        {districts.map(district => (
          <option key={district.slug} value={district.name}>{district.name}</option>
        ))}
      </select>
    </div>
  );
};

export default LocationSelector;