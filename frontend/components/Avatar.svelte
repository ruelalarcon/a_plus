<script>
    export let src = "https://upload.wikimedia.org/wikipedia/commons/d/d4/Cat_March_2010-1a.jpg"; // Default avatar image
    export let alt = "User Avatar";
  </script>
  
  <img class="avatar" src={src} alt={alt} />
  
  <style>
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      cursor: pointer;
    }
  </style>
  