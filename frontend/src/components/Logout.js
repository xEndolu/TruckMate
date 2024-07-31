// logout.js

const useLogout = () => {

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return handleLogout;
};

export default useLogout;